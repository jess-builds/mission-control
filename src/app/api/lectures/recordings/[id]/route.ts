import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'lectures');

// Helper to find recording path
async function findRecordingPath(id: string): Promise<{ metadataPath: string; audioPath: string; courseId: string } | null> {
  const coursesFile = path.join(DATA_DIR, 'courses.json');
  if (!fs.existsSync(coursesFile)) return null;
  
  const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf-8'));
  
  for (const course of courses) {
    const metadataPath = path.join(DATA_DIR, course.id, 'recordings', `${id}.json`);
    const audioPath = path.join(DATA_DIR, course.id, 'recordings', `${id}.webm`);
    if (fs.existsSync(metadataPath)) {
      return { metadataPath, audioPath, courseId: course.id };
    }
  }
  return null;
}

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const found = await findRecordingPath(id);
    if (!found) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    // Delete metadata file
    if (fs.existsSync(found.metadataPath)) {
      fs.unlinkSync(found.metadataPath);
    }
    
    // Delete audio file
    if (fs.existsSync(found.audioPath)) {
      fs.unlinkSync(found.audioPath);
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete recording:', error);
    return NextResponse.json({ error: 'Failed to delete recording' }, { status: 500 });
  }
}
