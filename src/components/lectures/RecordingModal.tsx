"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle } from "lucide-react";
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
    // Reset state when modal closes
    if (!open) {
      stopRecording();
      setSelectedCourse("");
      setRecordingTime(0);
      setIsUploading(false);
    }
  }, [open]);

  useEffect(() => {
    // Update timer
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

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
      // Request display media with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Required, but we'll only use audio
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } as MediaTrackConstraints,
        preferCurrentTab: false,
      } as DisplayMediaStreamOptions);

      // Check if we got audio
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach(track => track.stop());
        toast.error("No audio track found. Make sure to share a tab with audio.");
        return;
      }

      // Stop video track to save resources
      stream.getVideoTracks().forEach(track => track.stop());

      // Create audio-only stream
      const audioStream = new MediaStream(audioTracks);
      streamRef.current = audioStream;

      // Setup MediaRecorder
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

      // Handle stream end (user stops sharing)
      audioTracks[0].addEventListener('ended', () => {
        toast.info("Tab sharing stopped");
        stopRecording();
      });

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      toast.success("Recording started! Make sure your Zoom audio is on.");
    } catch (error) {
      console.error("Error starting recording:", error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error("Permission denied. Please allow screen sharing.");
      } else {
        toast.error("Failed to start recording. Make sure to share a tab with audio.");
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
      // Create blob from chunks
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      
      // Create form data
      const formData = new FormData();
      formData.append('audio', blob, `lecture_${Date.now()}.webm`);
      formData.append('courseId', selectedCourse);
      formData.append('date', new Date().toISOString().split('T')[0]);

      // Upload recording
      const uploadResponse = await fetch('/api/lectures/recordings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { recordingId, metadata } = await uploadResponse.json();
      toast.success("Recording uploaded successfully!");

      // Trigger transcription
      const transcribeResponse = await fetch(`/api/lectures/recordings/${recordingId}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse }),
      });

      if (transcribeResponse.ok) {
        toast.success("Transcription started! You'll be notified when it's complete.");
      } else {
        toast.warning("Recording saved, but transcription failed to start. Try again later.");
      }

      // Call completion callback
      if (onRecordingComplete) {
        onRecordingComplete(recordingId, selectedCourse);
      }

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading recording:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload recording");
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
            Select your course and share the Zoom tab to record audio
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
                      <li>Share the Zoom tab (not entire screen)</li>
                      <li>Enable "Share tab audio" in the dialog</li>
                      <li>Make sure Zoom audio is unmuted</li>
                      <li>Recording will stop if you close the tab</li>
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
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
                  <div className="relative bg-red-500 text-white rounded-full p-4">
                    <Mic className="h-8 w-8" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-2xl font-mono font-bold">{formatTime(recordingTime)}</p>
                <p className="text-sm text-muted-foreground">Recording in progress...</p>
              </div>

              <Button 
                onClick={stopRecording} 
                variant="destructive" 
                className="w-full gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Recording
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <p className="font-medium">Uploading recording...</p>
                <p className="text-sm text-muted-foreground">
                  This may take a few moments
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Type augmentation for TypeScript
interface DisplayMediaStreamOptions extends MediaStreamConstraints {
  preferCurrentTab?: boolean;
}