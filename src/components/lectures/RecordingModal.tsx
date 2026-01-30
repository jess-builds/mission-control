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
import { ScrollArea } from "@/components/ui/scroll-area";
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

const CHUNK_INTERVAL_MS = 15000;

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
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const allChunksRef = useRef<Blob[]>([]);
  const lastTranscribedLengthRef = useRef(0); // Track how much we've transcribed
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [liveTranscript]);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setSelectedCourse("");
    setRecordingTime(0);
    setIsUploading(false);
    setLiveTranscript("");
    setIsTranscribing(false);
    setIsRecording(false);
    setChunkCount(0);
    allChunksRef.current = [];
    lastTranscribedLengthRef.current = 0;
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

  const transcribeAccumulatedAudio = async () => {
    const chunks = [...allChunksRef.current];
    
    if (chunks.length === 0) {
      console.log('[Transcribe] No chunks yet');
      return;
    }
    
    // Create full blob with all audio (includes WebM header from first chunk)
    const fullBlob = new Blob(chunks, { type: 'audio/webm' });
    
    // Skip if we've already transcribed this
    if (fullBlob.size <= lastTranscribedLengthRef.current) {
      console.log('[Transcribe] No new audio since last transcription');
      return;
    }
    
    console.log(`[Transcribe] Full audio: ${fullBlob.size} bytes (was ${lastTranscribedLengthRef.current})`);
    setIsTranscribing(true);
    setChunkCount(c => c + 1);

    try {
      const formData = new FormData();
      formData.append('audio', fullBlob, 'recording.webm');

      const response = await fetch('/api/lectures/transcribe-chunk', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('[Transcribe] Response:', data);
      
      if (response.ok && data.transcript && data.transcript.trim()) {
        // Replace entire transcript with new one (since we send full audio each time)
        setLiveTranscript(data.transcript.trim());
        lastTranscribedLengthRef.current = fullBlob.size;
      }
    } catch (error) {
      console.error('[Transcribe] Error:', error);
    } finally {
      setIsTranscribing(false);
    }
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

      stream.getVideoTracks().forEach(track => track.stop());

      const audioStream = new MediaStream(audioTracks);
      streamRef.current = audioStream;

      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      allChunksRef.current = [];
      lastTranscribedLengthRef.current = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          allChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleRecordingStop;

      audioTracks[0].addEventListener('ended', () => {
        toast.info("Tab sharing stopped");
        stopRecording();
      });

      mediaRecorder.start(1000);
      setIsRecording(true);
      
      // Start transcription interval - sends FULL audio each time
      chunkTimerRef.current = setInterval(() => {
        console.log('[Timer] Transcription interval triggered');
        transcribeAccumulatedAudio();
      }, CHUNK_INTERVAL_MS);
      
      toast.success("Recording started! Transcription updates every 15 seconds.");
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
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

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
    if (allChunksRef.current.length === 0) {
      toast.error("No recording data captured");
      return;
    }

    setIsUploading(true);

    try {
      const blob = new Blob(allChunksRef.current, { type: 'audio/webm' });
      
      const formData = new FormData();
      formData.append('audio', blob, `lecture_${Date.now()}.webm`);
      formData.append('courseId', selectedCourse);
      formData.append('date', new Date().toISOString().split('T')[0]);
      formData.append('liveTranscript', liveTranscript);

      const uploadResponse = await fetch('/api/lectures/recordings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { recordingId } = await uploadResponse.json();
      toast.success("Recording uploaded!");

      fetch(`/api/lectures/recordings/${recordingId}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse }),
      }).then(res => {
        if (res.ok) toast.success("Full transcription started!");
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
      <DialogContent className={`${isRecording ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <DialogHeader>
          <DialogTitle>Record Lecture</DialogTitle>
          <DialogDescription>
            {isRecording 
              ? "Recording with live Whisper transcription" 
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
                      <li>Transcription updates every ~15 seconds</li>
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
                    <p className="text-xs text-muted-foreground">Recording...</p>
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

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Live Transcription</p>
                    {isTranscribing && (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Update #{chunkCount}</span>
                    <span>•</span>
                    <span>{liveTranscript.split(' ').filter(w => w).length} words</span>
                  </div>
                </div>
                <ScrollArea className="h-48 w-full rounded border p-3 bg-muted/30">
                  <div ref={transcriptScrollRef} className="text-sm">
                    {liveTranscript ? (
                      <span>{liveTranscript}</span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        First transcription will appear after ~15 seconds...
                      </span>
                    )}
                  </div>
                </ScrollArea>
              </Card>
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

interface DisplayMediaStreamOptions extends MediaStreamConstraints {
  preferCurrentTab?: boolean;
}
