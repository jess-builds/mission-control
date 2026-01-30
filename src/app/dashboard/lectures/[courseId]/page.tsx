"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Mic, Clock, Calendar, FileText, AlertCircle, BookOpen, CheckSquare, Loader2, Sparkles, Pencil, Save, X, Trash2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import RecordingWidget from "@/components/lectures/RecordingWidget";
import LectureChat from "@/components/lectures/LectureChat";

interface Recording {
  id: string;
  courseId: string;
  date: string;
  duration: number | null;
  status: string;
  transcript: string | null;
  notes?: string | null;
  extractedTasks?: Array<{ task: string; dueDate?: string; priority?: string }>;
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
  const [course, setCourse] = useState<Course | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  // Selected recording state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Editing state
  const [activeTab, setActiveTab] = useState("notes");
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Selection state for batch delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Confirm dialog state
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'single' | 'batch'; id?: string } | null>(null);

  useEffect(() => {
    if (params.courseId) {
      fetchCourseData();
    }
  }, [params.courseId]);

  // Fetch selected recording details
  useEffect(() => {
    if (!selectedId) {
      setSelectedRecording(null);
      return;
    }
    
    const fetchRecordingDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/lectures/recordings/${selectedId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedRecording(data);
          setEditedNotes(data.notes || "");
        }
      } catch (error) {
        console.error("Failed to fetch recording:", error);
      } finally {
        setLoadingDetail(false);
      }
    };
    
    fetchRecordingDetail();
  }, [selectedId]);

  const fetchCourseData = async () => {
    try {
      const courseResponse = await fetch(`/api/lectures/courses/${params.courseId}`);
      if (!courseResponse.ok) throw new Error("Failed to fetch course");
      const courseData = await courseResponse.json();
      setCourse(courseData);

      const recordingsResponse = await fetch(`/api/lectures/courses/${params.courseId}/recordings`);
      if (!recordingsResponse.ok) throw new Error("Failed to fetch recordings");
      const recordingsData = await recordingsResponse.json();
      setRecordings(recordingsData);
      
      // Auto-select first recording if available
      if (recordingsData.length > 0 && !selectedId) {
        setSelectedId(recordingsData[0].id);
      }
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
      transcribed: { label: "Transcribed", variant: "secondary" as const },
      transcription_failed: { label: "Failed", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "outline" as const,
    };

    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const handleRecordingComplete = (recordingId: string, courseId: string) => {
    fetchCourseData();
    toast.success("Recording saved! Transcription in progress.");
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === recordings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recordings.map(r => r.id)));
    }
  };

  const deleteRecording = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/lectures/recordings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      
      toast.success("Recording deleted");
      if (selectedId === id) setSelectedId(null);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      fetchCourseData();
    } catch (error) {
      toast.error("Failed to delete recording");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  const batchDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch("/api/lectures/recordings/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      
      if (!res.ok) throw new Error("Failed to delete");
      
      const data = await res.json();
      toast.success(`Deleted ${data.deletedCount} recording(s)`);
      
      if (selectedId && selectedIds.has(selectedId)) setSelectedId(null);
      setSelectedIds(new Set());
      fetchCourseData();
    } catch (error) {
      toast.error("Failed to delete recordings");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'single' && confirmDelete.id) {
      deleteRecording(confirmDelete.id);
    } else if (confirmDelete.type === 'batch') {
      batchDelete();
    }
  };

  const generateNotes = async () => {
    if (!selectedRecording) return;
    
    setIsGeneratingNotes(true);
    try {
      const res = await fetch(`/api/lectures/recordings/${selectedRecording.id}/generate-notes`, {
        method: "POST",
      });
      
      if (!res.ok) throw new Error("Failed to generate notes");
      
      const data = await res.json();
      setSelectedRecording({ ...selectedRecording, notes: data.notes });
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
    if (!selectedRecording) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/lectures/recordings/${selectedRecording.id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editedNotes }),
      });
      
      if (!res.ok) throw new Error("Failed to save notes");
      
      setSelectedRecording({ ...selectedRecording, notes: editedNotes });
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
    setEditedNotes(selectedRecording?.notes || "");
    setIsEditing(false);
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

  const hasNotes = selectedRecording?.notes && selectedRecording.notes.trim().length > 0;
  const hasTasks = selectedRecording?.extractedTasks && selectedRecording.extractedTasks.length > 0;

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/lectures">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-10 rounded-full"
              style={{ backgroundColor: course.color }}
            />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{course.name}</h2>
              <p className="text-sm text-muted-foreground">
                {course.code}
                {course.professor && ` • ${course.professor}`}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setIsRecording(true)} className="gap-2">
          <Mic className="h-4 w-4" />
          Record
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
        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Recording List */}
          <div className="w-80 flex-shrink-0 flex flex-col bg-card border rounded-xl overflow-hidden">
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === recordings.length && recordings.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <p className="text-sm font-medium text-muted-foreground">
                  {selectedIds.size > 0 
                    ? `${selectedIds.size} selected` 
                    : `${recordings.length} Recording${recordings.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmDelete({ type: 'batch' })}
                  disabled={isDeleting}
                  className="h-7 px-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {recordings.map((recording) => (
                  <div
                    key={recording.id}
                    className={`
                      flex items-start gap-2 p-3 rounded-lg transition-all
                      ${selectedId === recording.id 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted/50 border border-transparent'
                      }
                    `}
                  >
                    <Checkbox
                      checked={selectedIds.has(recording.id)}
                      onCheckedChange={() => toggleSelect(recording.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5"
                    />
                    <button
                      onClick={() => {
                        setSelectedId(recording.id);
                        setIsEditing(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {new Date(recording.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {getStatusBadge(recording.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(recording.duration)}
                        </span>
                        {recording.transcript && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Transcript
                          </span>
                        )}
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-50 hover:opacity-100 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({ type: 'single', id: recording.id });
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Recording Detail */}
          <div className="flex-1 flex flex-col bg-card border rounded-xl overflow-hidden">
            {loadingDetail ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : selectedRecording ? (
              <>
                {/* Tabs Header */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <div className="border-b px-6 py-3 flex items-center justify-between">
                    <TabsList className="h-10">
                      <TabsTrigger value="notes" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Notes
                      </TabsTrigger>
                      <TabsTrigger value="transcript" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Transcript
                      </TabsTrigger>
                      <TabsTrigger value="tasks" className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        Tasks {hasTasks && `(${selectedRecording.extractedTasks?.length})`}
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDuration(selectedRecording.duration)}
                    </div>
                  </div>

                  <TabsContent value="notes" className="flex-1 flex flex-col p-4 mt-0">
                    {/* Notes toolbar */}
                    <div className="flex items-center justify-between mb-3">
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
                              {hasNotes ? "Regenerate" : "Generate"}
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
                            <Button variant="outline" size="sm" onClick={cancelEdit}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button size="sm" onClick={saveNotes} disabled={isSaving}>
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

                    <ScrollArea className="flex-1">
                      {isEditing ? (
                        <Textarea
                          value={editedNotes}
                          onChange={(e) => setEditedNotes(e.target.value)}
                          className="min-h-[300px] font-mono text-sm"
                          placeholder="Write your notes in Markdown..."
                        />
                      ) : hasNotes ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedRecording.notes || ""}
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
                            Generate Notes
                          </Button>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="transcript" className="flex-1 p-4 mt-0">
                    <ScrollArea className="h-full">
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {selectedRecording.transcript || "No transcript available."}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="tasks" className="flex-1 p-4 mt-0">
                    <ScrollArea className="h-full">
                      {hasTasks ? (
                        <div className="space-y-3">
                          {selectedRecording.extractedTasks?.map((task, i) => (
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
                        <div className="text-center text-muted-foreground py-12">
                          <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No tasks extracted from this recording.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a recording to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat section below dual pane */}
      {recordings.length > 0 && (
        <div className="mt-6">
          <LectureChat
            courseId={params.courseId}
            recordingId={selectedId || undefined}
            transcript={selectedRecording?.transcript || undefined}
            title={selectedRecording ? "Ask about this lecture" : `Ask about ${course?.name || 'this course'}`}
            placeholder={selectedRecording ? "Ask about this lecture..." : "Ask about any lecture..."}
          />
        </div>
      )}

      {course && (
        <RecordingWidget
          open={isRecording}
          onOpenChange={setIsRecording}
          courses={[course]}
          onRecordingComplete={handleRecordingComplete}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={confirmDelete?.type === 'batch' 
          ? `Delete ${selectedIds.size} Recording${selectedIds.size !== 1 ? 's' : ''}?`
          : "Delete Recording?"
        }
        description="This action cannot be undone. The recording and its transcript will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
