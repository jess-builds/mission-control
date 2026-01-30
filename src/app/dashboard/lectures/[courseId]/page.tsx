"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Mic, Clock, Calendar, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import RecordingModal from "@/components/lectures/RecordingModal";

interface Recording {
  id: string;
  courseId: string;
  date: string;
  duration: number | null;
  status: string;
  transcript: string | null;
  summary?: {
    keyPoints?: string[];
    termsIntroduced?: string[];
    questionsAsked?: string[];
  };
  createdAt: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  professor?: string;
  color?: string;
}

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default function CoursePage({ params: promiseParams }: PageProps) {
  const params = use(promiseParams);
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (params.courseId) {
      fetchCourseData();
    }
  }, [params.courseId]);

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const courseResponse = await fetch(`/api/lectures/courses/${params.courseId}`);
      if (!courseResponse.ok) throw new Error("Failed to fetch course");
      const courseData = await courseResponse.json();
      setCourse(courseData);

      // Fetch recordings
      const recordingsResponse = await fetch(`/api/lectures/courses/${params.courseId}/recordings`);
      if (!recordingsResponse.ok) throw new Error("Failed to fetch recordings");
      const recordingsData = await recordingsResponse.json();
      setRecordings(recordingsData);
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast.error("Failed to load course data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      uploaded: { label: "Uploaded", variant: "secondary" as const },
      transcribing: { label: "Transcribing...", variant: "default" as const },
      transcribed: { label: "Transcribed", variant: "success" as const },
      transcription_failed: { label: "Failed", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "outline" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleRecordingComplete = (recordingId: string, courseId: string) => {
    // Refresh recordings
    fetchCourseData();
    toast.success("Recording saved! Transcription in progress.");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Course not found</h3>
          <p className="text-muted-foreground mb-4">
            This course doesn't exist or has been deleted
          </p>
          <Link href="/dashboard/lectures">
            <Button>Back to Lectures</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/lectures">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-12 rounded-full"
              style={{ backgroundColor: course.color }}
            />
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{course.name}</h2>
              <p className="text-muted-foreground">
                {course.code}
                {course.professor && ` • ${course.professor}`}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setIsRecording(true)} className="gap-2">
          <Mic className="h-4 w-4" />
          Start Recording
        </Button>
      </div>

      {recordings.length === 0 ? (
        <Card className="p-12 text-center">
          <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
          <p className="text-muted-foreground mb-4">
            Start recording your first lecture for this course
          </p>
          <Button onClick={() => setIsRecording(true)} className="gap-2">
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {recordings.map((recording) => (
            <Link
              key={recording.id}
              href={`/dashboard/lectures/${params.courseId}/${recording.date}`}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {new Date(recording.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      {getStatusBadge(recording.status)}
                    </div>
                    {recording.summary?.keyPoints && recording.summary.keyPoints.length > 0 && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {recording.summary.keyPoints[0]}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(recording.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(recording.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {recording.transcript && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>Transcript available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {course && (
        <RecordingModal
          open={isRecording}
          onOpenChange={setIsRecording}
          courses={[course]}
          onRecordingComplete={handleRecordingComplete}
        />
      )}
    </div>
  );
}