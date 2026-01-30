"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Loader2, X, Minus, GripVertical, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface RecordingWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  onRecordingComplete?: (recordingId: string, courseId: string) => void;
}

export default function RecordingWidget({
  open,
  onOpenChange,
  courses,
  onRecordingComplete,
}: RecordingWidgetProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  
  // Position stored in ref for smooth dragging (no re-renders)
  const posRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const rafRef = useRef<number | null>(null);

  const getWidgetDimensions = useCallback(() => {
    if (isMinimized) return { width: 180, height: 44 };
    if (isUploading) return { width: 280, height: 120 };
    return { width: 280, height: 160 };
  }, [isMinimized, isUploading]);

  // Apply position to DOM directly
  const applyPosition = useCallback(() => {
    if (widgetRef.current) {
      widgetRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
    }
  }, []);

  // Position widget to bottom-right when recording starts
  useEffect(() => {
    if (isRecording && posRef.current.x === 0 && posRef.current.y === 0) {
      const dims = getWidgetDimensions();
      posRef.current = {
        x: window.innerWidth - dims.width - 20,
        y: window.innerHeight - dims.height - 20,
      };
      applyPosition();
    }
  }, [isRecording, getWidgetDimensions, applyPosition]);

  // Adjust position when minimizing
  useEffect(() => {
    if (isRecording) {
      const dims = getWidgetDimensions();
      posRef.current = {
        x: Math.min(posRef.current.x, window.innerWidth - dims.width - 10),
        y: Math.min(posRef.current.y, window.innerHeight - dims.height - 10),
      };
      applyPosition();
    }
  }, [isMinimized, isRecording, getWidgetDimensions, applyPosition]);

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

  // Optimized drag with RAF
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, select, [role="combobox"]')) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: posRef.current.x,
      startPosY: posRef.current.y,
    };
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const dims = getWidgetDimensions();
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    const newX = Math.max(0, Math.min(window.innerWidth - dims.width - 10, dragRef.current.startPosX + deltaX));
    const newY = Math.max(0, Math.min(window.innerHeight - dims.height - 10, dragRef.current.startPosY + deltaY));
    
    posRef.current = { x: newX, y: newY };
    
    // Use RAF for smooth updates
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(applyPosition);
  }, [isDragging, getWidgetDimensions, applyPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [isDragging]);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setSelectedCourse("");
    setRecordingTime(0);
    setIsUploading(false);
    setIsRecording(false);
    setIsMinimized(false);
    posRef.current = { x: 0, y: 0 };
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

      audioTracks[0].addEventListener('ended', () => {
        toast.info("Tab sharing stopped");
        stopRecording();
      });

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
      formData.append('date', new Date().toISOString().split('T')[0]);
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

  const handleClose = () => {
    if (isRecording) {
      if (!confirm("Stop recording and close?")) return;
      stopRecording();
    }
    onOpenChange(false);
  };

  if (!open) return null;

  // SETUP MODE: Show centered modal dialog
  if (!isRecording && !isUploading) {
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
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // RECORDING/UPLOADING MODE: Show floating widget
  const dims = getWidgetDimensions();
  
  return (
    <div
      ref={widgetRef}
      className={cn(
        "fixed z-50 shadow-2xl rounded-lg border bg-background/95 backdrop-blur-sm",
        "left-0 top-0 will-change-transform",
        isDragging ? "cursor-grabbing select-none" : "cursor-grab"
      )}
      style={{ width: dims.width }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-mono text-sm font-medium">{formatTime(recordingTime)}</span>
            </div>
          )}
          {isUploading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isRecording && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minus className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3">
          {isRecording && (
            <Button 
              onClick={stopRecording} 
              variant="destructive" 
              className="w-full h-8 gap-2 text-sm"
            >
              <Square className="h-3.5 w-3.5" />
              Stop Recording
            </Button>
          )}

          {isUploading && (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">Processing recording...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface DisplayMediaStreamOptions extends MediaStreamConstraints {
  preferCurrentTab?: boolean;
}
