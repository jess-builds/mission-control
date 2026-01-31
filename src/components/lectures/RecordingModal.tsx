"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle } from "lucide-react";

// Get today's date in EST/EDT (client-side)
function getTodayEST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface RecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  onRecordingComplete?: (recordingId: string, courseId: string) => void;
}

export default function RecordingModal({
  open,
  onOpenChange,
  courses,
  onRecordingComplete,
}: RecordingModalProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) {
      cleanup();
    }
  }, [open]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setSelectedCourse("");
    setRecordingTime(0);
    setIsUploading(false);
    setIsRecording(false);
    chunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course first");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } as MediaTrackConstraints,
        preferCurrentTab: false,
      } as DisplayMediaStreamOptions);

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach(track => track.stop());
        toast.error("No audio track found. Make sure to share a tab with audio.");
        return;
      }

      // Stop video tracks - we only need audio
      stream.getVideoTracks().forEach(track => track.stop());

      const audioStream = new MediaStream(audioTracks);
      streamRef.current = audioStream;

      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleRecordingStop;

      // Handle tab being closed/stopped
      audioTracks[0].addEventListener('ended', () => {
        toast.info("Tab sharing stopped");
        stopRecording();
      });

      // Record in 10-second chunks for reliable data capture
      mediaRecorder.start(10000);
      setIsRecording(true);
      
      toast.success("Recording started!");
    } catch (error) {
      console.error("Error starting recording:", error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error("Permission denied.");
      } else {
        toast.error("Failed to start recording.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  };

  const handleRecordingStop = async () => {
    if (chunksRef.current.length === 0) {
      toast.error("No recording data captured");
      return;
    }

    setIsUploading(true);

    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      
      console.log(`[Upload] Recording size: ${fileSizeMB} MB`);
      
      const formData = new FormData();
      formData.append('audio', blob, `lecture_${Date.now()}.webm`);
      formData.append('courseId', selectedCourse);
      formData.append('date', getTodayEST());
      formData.append('duration', String(recordingTime));

      const uploadResponse = await fetch('/api/lectures/recordings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { recordingId } = await uploadResponse.json();
      toast.success("Recording uploaded! Starting transcription...");

      // Trigger async transcription (chunked server-side)
      fetch(`/api/lectures/recordings/${recordingId}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse }),
      }).then(res => {
        if (res.ok) {
          toast.success("Transcription complete!");
        } else {
          toast.error("Transcription failed - check logs");
        }
      }).catch(() => {
        toast.error("Transcription request failed");
      });

      if (onRecordingComplete) {
        onRecordingComplete(recordingId, selectedCourse);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Lecture</DialogTitle>
          <DialogDescription>
            {isRecording 
              ? "Recording in progress..." 
              : "Select your course and share the Zoom tab to record audio"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isRecording && !isUploading && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-blue-500">Recording Tips:</p>
                    <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>Share the Zoom tab with audio enabled</li>
                      <li>You can mute the tab after sharing</li>
                      <li>Supports recordings up to 3+ hours</li>
                      <li>Transcription happens after recording</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Button 
                onClick={startRecording} 
                className="w-full gap-2"
                disabled={!selectedCourse}
              >
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            </>
          )}

          {isRecording && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
                    <div className="relative bg-red-500 text-white rounded-full p-2">
                      <Mic className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="font-mono font-bold text-lg">{formatTime(recordingTime)}</p>
                    <p className="text-xs text-muted-foreground">Recording audio...</p>
                  </div>
                </div>
                <Button 
                  onClick={stopRecording} 
                  variant="destructive" 
                  size="sm"
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </div>

              <Card className="p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  Recording will be transcribed after you stop.
                  <br />
                  <span className="text-xs">Supports lectures up to 3+ hours.</span>
                </p>
              </Card>
            </div>
          )}

          {isUploading && (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <p className="font-medium">Uploading recording...</p>
                <p className="text-sm text-muted-foreground">
                  This may take a moment for longer recordings
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DisplayMediaStreamOptions extends MediaStreamConstraints {
  preferCurrentTab?: boolean;
}
