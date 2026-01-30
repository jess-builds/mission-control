"use client";

import { useEffect, useState } from "react";
import { Plus, Mic, Calendar, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
  code: string;
  professor?: string;
  schedule?: {
    days: string[];
    time: string;
    timezone: string;
  };
  color?: string;
  recordingCount?: number;
  lastRecordingDate?: string;
}

export default function LecturesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    professor: "",
    color: "#4169E1"
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/lectures/courses");
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.code) {
      toast.error("Name and code are required");
      return;
    }

    try {
      const response = await fetch("/api/lectures/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add course");
      }

      const course = await response.json();
      setCourses([...courses, course]);
      setIsAddingCourse(false);
      setNewCourse({ name: "", code: "", professor: "", color: "#4169E1" });
      toast.success("Course added successfully");
    } catch (error) {
      console.error("Error adding course:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add course");
    }
  };

  const startRecording = () => {
    // TODO: Implement recording flow
    toast.info("Recording feature coming soon!");
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lectures</h2>
          <p className="text-muted-foreground">
            Record and transcribe your class lectures
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={startRecording} className="gap-2">
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
          <Dialog open={isAddingCourse} onOpenChange={setIsAddingCourse}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription>
                  Add a course to organize your lecture recordings
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Course Name</Label>
                  <Input
                    id="name"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    placeholder="e.g., Cultural Anthropology"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Course Code</Label>
                  <Input
                    id="code"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    placeholder="e.g., ANTH 106"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="professor">Professor (optional)</Label>
                  <Input
                    id="professor"
                    value={newCourse.professor}
                    onChange={(e) => setNewCourse({ ...newCourse, professor: e.target.value })}
                    placeholder="e.g., Dr. Smith"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={newCourse.color}
                      onChange={(e) => setNewCourse({ ...newCourse, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={newCourse.color}
                      onChange={(e) => setNewCourse({ ...newCourse, color: e.target.value })}
                      placeholder="#4169E1"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingCourse(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCourse}>Add Course</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading courses...</div>
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first course to start recording lectures
          </p>
          <Button onClick={() => setIsAddingCourse(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/dashboard/lectures/${course.id}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-3 h-16 rounded-full mr-4"
                    style={{ backgroundColor: course.color }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{course.name}</h3>
                    <p className="text-sm text-muted-foreground">{course.code}</p>
                    {course.professor && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {course.professor}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mic className="h-4 w-4" />
                    <span>{course.recordingCount || 0} recordings</span>
                  </div>
                  {course.lastRecordingDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(course.lastRecordingDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}