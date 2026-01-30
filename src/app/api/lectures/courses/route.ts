import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
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

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function getCourses(): Promise<Course[]> {
  await ensureDataDir();
  
  if (!existsSync(COURSES_FILE)) {
    await writeFile(COURSES_FILE, JSON.stringify([]));
    return [];
  }
  
  const data = await readFile(COURSES_FILE, 'utf-8');
  return JSON.parse(data);
}

async function saveCourses(courses: Course[]) {
  await ensureDataDir();
  await writeFile(COURSES_FILE, JSON.stringify(courses, null, 2));
}

export async function GET() {
  try {
    const courses = await getCourses();
    
    // For each course, count recordings
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const recordingsDir = path.join(DATA_DIR, course.id, 'recordings');
        let recordingCount = 0;
        let lastRecordingDate = null;
        
        if (existsSync(recordingsDir)) {
          const files = await readdir(recordingsDir);
          const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'meta.json');
          recordingCount = jsonFiles.length;
          
          if (recordingCount > 0) {
            // Get the most recent recording date
            const dates = jsonFiles.map(f => f.replace('.json', ''));
            dates.sort((a, b) => b.localeCompare(a));
            lastRecordingDate = dates[0];
          }
        }
        
        return {
          ...course,
          recordingCount,
          lastRecordingDate
        };
      })
    );
    
    return NextResponse.json(coursesWithStats);
  } catch (error) {
    console.error('Error getting courses:', error);
    return NextResponse.json({ error: 'Failed to get courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }
    
    const courses = await getCourses();
    
    // Generate ID from code (e.g., "ANTH 106" -> "ANTH-106")
    const id = body.code.replace(/\s+/g, '-').toUpperCase();
    
    // Check if course already exists
    if (courses.some(c => c.id === id)) {
      return NextResponse.json(
        { error: 'Course with this code already exists' },
        { status: 409 }
      );
    }
    
    const now = new Date().toISOString();
    const newCourse: Course = {
      id,
      name: body.name,
      code: body.code,
      professor: body.professor,
      schedule: body.schedule,
      color: body.color || '#4169E1',
      createdAt: now,
      updatedAt: now
    };
    
    courses.push(newCourse);
    await saveCourses(courses);
    
    // Create course directory structure
    const courseDir = path.join(DATA_DIR, id);
    const recordingsDir = path.join(courseDir, 'recordings');
    await mkdir(recordingsDir, { recursive: true });
    
    // Save course metadata
    const metaFile = path.join(courseDir, 'meta.json');
    await writeFile(metaFile, JSON.stringify(newCourse, null, 2));
    
    return NextResponse.json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}

// Import readdir for counting recordings
import { readdir } from 'fs/promises';