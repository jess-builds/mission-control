import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data', 'lectures');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const courseId = formData.get('courseId') as string;
    const date = formData.get('date') as string || new Date().toISOString().split('T')[0];
    
    if (!file || !courseId) {
      return NextResponse.json(
        { error: 'Audio file and courseId are required' },
        { status: 400 }
      );
    }
    
    // Verify course exists
    const coursesFile = path.join(DATA_DIR, 'courses.json');
    if (!existsSync(coursesFile)) {
      return NextResponse.json({ error: 'No courses found' }, { status: 404 });
    }
    
    const coursesData = await readFile(coursesFile, 'utf-8');
    const courses = JSON.parse(coursesData);
    if (!courses.find((c: any) => c.id === courseId)) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Create recordings directory if it doesn't exist
    const recordingsDir = path.join(DATA_DIR, courseId, 'recordings');
    if (!existsSync(recordingsDir)) {
      await mkdir(recordingsDir, { recursive: true });
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique ID for the recording
    const recordingId = `${date}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Save audio file
    const audioPath = path.join(recordingsDir, `${recordingId}.webm`);
    await writeFile(audioPath, buffer);
    
    // Create initial metadata
    const metadata = {
      id: recordingId,
      courseId,
      date,
      duration: null, // Will be calculated later
      audioPath: `/data/lectures/${courseId}/recordings/${recordingId}.webm`,
      transcript: null,
      summary: null,
      extractedTasks: [],
      createdAt: new Date().toISOString(),
      status: 'uploaded',
      fileName: file.name,
      fileSize: buffer.length
    };
    
    // Save metadata
    const metadataPath = path.join(recordingsDir, `${recordingId}.json`);
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return NextResponse.json({
      message: 'Recording uploaded successfully',
      recordingId,
      metadata
    });
  } catch (error) {
    console.error('Error uploading recording:', error);
    return NextResponse.json({ error: 'Failed to upload recording' }, { status: 500 });
  }
}

// Configure Next.js to handle large file uploads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for large uploads