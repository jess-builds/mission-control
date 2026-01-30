"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileText, BookOpen, CheckSquare, Clock, Loader2, Pencil, Save, X, Sparkles } from "lucide-react";
import LectureChat from "@/components/lectures/LectureChat";
import { toast } from "sonner";

interface Recording {
  id: string;
  courseId: string;
  date: string;
  duration: number;
  transcript: string;
  summary: string | null;
  notes: string | null;
  extractedTasks: Array<{ task: string; dueDate?: string; priority?: string }>;
  status: string;
  createdAt: string;
}

export default function RecordingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const recordingId = params.recordingId as string;

  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("notes");
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRecording();
  }, [courseId, recordingId]);

  const fetchRecording = async () => {
    try {
      const res = await fetch(`/api/lectures/recordings/${recordingId}`);
      if (!res.ok) throw new Error("Recording not found");
      const data = await res.json();
      setRecording(data);
      setEditedNotes(data.notes || "");
    } catch (error) {
      console.error("Failed to fetch recording:", error);
      toast.error("Failed to load recording");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const generateNotes = async () => {
    if (!recording) return;
    
    setIsGeneratingNotes(true);
    try {
      const res = await fetch(`/api/lectures/recordings/${recordingId}/generate-notes`, {
        method: "POST",
      });
      
      if (!res.ok) throw new Error("Failed to generate notes");
      
      const data = await res.json();
      setRecording({ ...recording, notes: data.notes });
      setEditedNotes(data.notes);
      toast.success("Notes generated!");
    } catch (error) {
      console.error("Failed to generate notes:", error);
      toast.error("Failed to generate notes");
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const saveNotes = async () => {
    if (!recording) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/lectures/recordings/${recordingId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editedNotes }),
      });
      
      if (!res.ok) throw new Error("Failed to save notes");
      
      setRecording({ ...recording, notes: editedNotes });
      setIsEditing(false);
      toast.success("Notes saved!");
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditedNotes(recording?.notes || "");
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Recording not found</p>
        </Card>
      </div>
    );
  }

  const hasNotes = recording.notes && recording.notes.trim().length > 0;
  const hasTasks = recording.extractedTasks && recording.extractedTasks.length > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to {courseId.toUpperCase()}
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(recording.duration)}
          </Badge>
          <Badge variant="outline">{recording.date}</Badge>
        </div>
      </div>

      {/* Main Content */}
      <Card className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="transcript" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Full Transcript
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks {hasTasks && `(${recording.extractedTasks.length})`}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notes" className="p-6">
            {/* Notes toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {hasNotes ? "AI-generated notes" : "No notes yet"}
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateNotes}
                      disabled={isGeneratingNotes}
                    >
                      {isGeneratingNotes ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {hasNotes ? "Regenerate" : "Generate Notes"}
                    </Button>
                    {hasNotes && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveNotes}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              {isEditing ? (
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="min-h-[380px] font-mono text-sm"
                  placeholder="Write your notes in Markdown..."
                />
              ) : hasNotes ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {recording.notes || ""}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No notes have been generated yet.</p>
                  <Button onClick={generateNotes} disabled={isGeneratingNotes}>
                    {isGeneratingNotes ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Notes from Transcript
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="transcript" className="p-6">
            <ScrollArea className="h-[400px]">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {recording.transcript || "No transcript available."}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tasks" className="p-6">
            <ScrollArea className="h-[400px]">
              {hasTasks ? (
                <div className="space-y-3">
                  {recording.extractedTasks.map((task, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-start justify-between">
                        <p className="font-medium">{task.task}</p>
                        {task.dueDate && (
                          <Badge variant="outline">{task.dueDate}</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks were extracted from this recording.</p>
                  <p className="text-sm mt-2">
                    Use the chat below to ask me to add specific tasks.
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Chat Section */}
      <LectureChat
        courseId={courseId}
        recordingId={recordingId}
        transcript={recording.transcript}
        title="Ask about this lecture"
        placeholder="Ask a question about this lecture, or ask me to add a task..."
      />
    </div>
  );
}
