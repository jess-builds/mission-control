import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'lectures');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Search for the recording in all course folders
    const coursesFile = path.join(DATA_DIR, 'courses.json');
    if (!fs.existsSync(coursesFile)) {
      return NextResponse.json({ error: 'No courses found' }, { status: 404 });
    }
    
    const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf-8'));
    
    for (const course of courses) {
      const recordingPath = path.join(DATA_DIR, course.id, 'recordings', `${id}.json`);
      if (fs.existsSync(recordingPath)) {
        const recording = JSON.parse(fs.readFileSync(recordingPath, 'utf-8'));
        return NextResponse.json(recording);
      }
    }
    
    return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
  } catch (error) {
    console.error('Failed to fetch recording:', error);
    return NextResponse.json({ error: 'Failed to fetch recording' }, { status: 500 });
  }
}
