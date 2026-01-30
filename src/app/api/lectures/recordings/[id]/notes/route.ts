import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'lectures');

// Find recording by ID across all courses
async function findRecording(recordingId: string): Promise<{ path: string; data: any; courseId: string } | null> {
  const coursesFile = path.join(DATA_DIR, 'courses.json');
  if (!existsSync(coursesFile)) return null;
  
  const courses = JSON.parse(await readFile(coursesFile, 'utf-8'));
  
  for (const course of courses) {
    const recordingPath = path.join(DATA_DIR, course.id, 'recordings', `${recordingId}.json`);
    if (existsSync(recordingPath)) {
      const data = JSON.parse(await readFile(recordingPath, 'utf-8'));
      return { path: recordingPath, data, courseId: course.id };
    }
  }
  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recordingId } = await params;
  
  try {
    const { notes } = await request.json();
    
    const recording = await findRecording(recordingId);
    
    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    const { data: metadata, path: metadataPath } = recording;
    
    // Update notes
    metadata.notes = notes;
    metadata.notesUpdatedAt = new Date().toISOString();
    metadata.notesSource = 'manual';
    
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return NextResponse.json({
      message: 'Notes saved successfully',
      notes
    });
  } catch (error) {
    console.error('Error saving notes:', error);
    return NextResponse.json({
      error: 'Failed to save notes'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recordingId } = await params;
  
  try {
    const recording = await findRecording(recordingId);
    
    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      notes: recording.data.notes || null
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({
      error: 'Failed to fetch notes'
    }, { status: 500 });
  }
}
