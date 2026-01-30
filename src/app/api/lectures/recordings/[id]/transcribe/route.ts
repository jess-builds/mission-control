import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data', 'lectures');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recordingId } = await params;
  
  try {
    // Parse courseId from request body
    const { courseId } = await request.json();
    
    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }
    
    // Check if recording exists
    const metadataPath = path.join(DATA_DIR, courseId, 'recordings', `${recordingId}.json`);
    if (!existsSync(metadataPath)) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    // Load recording metadata
    const metadataData = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataData);
    
    // Check if already transcribed
    if (metadata.transcript && metadata.status === 'transcribed') {
      return NextResponse.json({
        message: 'Recording already transcribed',
        metadata
      });
    }
    
    // Get audio file path
    const audioPath = path.join(DATA_DIR, courseId, 'recordings', `${recordingId}.webm`);
    if (!existsSync(audioPath)) {
      return NextResponse.json({ error: 'Audio file not found' }, { status: 404 });
    }
    
    // Update status to transcribing
    metadata.status = 'transcribing';
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    try {
      // Transcribe with Whisper
      const audioFile = fs.createReadStream(audioPath);
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'verbose_json',
      });
      
      // Update metadata with transcription
      metadata.transcript = transcription.text;
      metadata.status = 'transcribed';
      metadata.transcribedAt = new Date().toISOString();
      metadata.duration = transcription.duration;
      
      // If we got segments with timestamps, store them
      if (transcription.segments) {
        metadata.segments = transcription.segments;
      }
      
      // Save updated metadata
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      // Trigger task extraction and summary generation (async, don't wait)
      // This will be handled by Jess through the notification system
      fetch(`http://localhost:3001/api/jess/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lecture_transcribed',
          courseId,
          recordingId,
          transcript: metadata.transcript
        })
      }).catch(console.error);
      
      return NextResponse.json({
        message: 'Transcription completed',
        metadata
      });
    } catch (transcriptionError) {
      // Update status to failed
      metadata.status = 'transcription_failed';
      metadata.error = String(transcriptionError);
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      throw transcriptionError;
    }
  } catch (error) {
    console.error('Error transcribing recording:', error);
    return NextResponse.json({ 
      error: 'Failed to transcribe recording',
      details: String(error) 
    }, { status: 500 });
  }
}

// Configure for longer timeout since transcription can take a while
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout