import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'lectures');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');

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
  createdAt: string;
  updatedAt: string;
}

async function getCourses(): Promise<Course[]> {
  if (!existsSync(COURSES_FILE)) {
    return [];
  }
  
  const data = await readFile(COURSES_FILE, 'utf-8');
  return JSON.parse(data);
}

async function saveCourses(courses: Course[]) {
  await writeFile(COURSES_FILE, JSON.stringify(courses, null, 2));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const courses = await getCourses();
    const course = courses.find(c => c.id === id);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Load course metadata from its directory
    const metaFile = path.join(DATA_DIR, id, 'meta.json');
    if (existsSync(metaFile)) {
      const metaData = await readFile(metaFile, 'utf-8');
      return NextResponse.json(JSON.parse(metaData));
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error('Error getting course:', error);
    return NextResponse.json({ error: 'Failed to get course' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const courses = await getCourses();
    const courseIndex = courses.findIndex(c => c.id === id);
    
    if (courseIndex === -1) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const updatedCourse: Course = {
      ...courses[courseIndex],
      ...body,
      id, // Prevent ID change
      updatedAt: new Date().toISOString()
    };
    
    courses[courseIndex] = updatedCourse;
    await saveCourses(courses);
    
    // Update course metadata file
    const metaFile = path.join(DATA_DIR, id, 'meta.json');
    await writeFile(metaFile, JSON.stringify(updatedCourse, null, 2));
    
    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const courses = await getCourses();
    const courseIndex = courses.findIndex(c => c.id === id);
    
    if (courseIndex === -1) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Remove from courses list
    courses.splice(courseIndex, 1);
    await saveCourses(courses);
    
    // Delete course directory (with all recordings)
    const courseDir = path.join(DATA_DIR, id);
    if (existsSync(courseDir)) {
      await rm(courseDir, { recursive: true, force: true });
    }
    
    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}