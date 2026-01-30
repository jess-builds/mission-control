import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir, readdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DATA_DIR = path.join(process.cwd(), 'data', 'lectures');
const CHUNK_DIR = path.join(process.cwd(), 'data', 'temp-chunks');

// Max chunk duration in seconds (10 minutes = safe under 25MB at 128kbps)
const CHUNK_DURATION_SEC = 600;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function getAudioDuration(audioPath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error('Error getting audio duration:', error);
    return 0;
  }
}

async function splitAudioIntoChunks(audioPath: string, outputDir: string): Promise<string[]> {
  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });
  
  const duration = await getAudioDuration(audioPath);
  const numChunks = Math.ceil(duration / CHUNK_DURATION_SEC);
  
  console.log(`[Transcribe] Audio duration: ${duration}s, splitting into ${numChunks} chunks`);
  
  if (numChunks <= 1) {
    // No splitting needed - file is small enough
    return [audioPath];
  }
  
  const chunkPaths: string[] = [];
  
  for (let i = 0; i < numChunks; i++) {
    const startTime = i * CHUNK_DURATION_SEC;
    const chunkPath = path.join(outputDir, `chunk_${i.toString().padStart(3, '0')}.webm`);
    
    // Use ffmpeg to extract chunk
    // -vn = no video, -acodec copy = copy audio codec (fast, no re-encoding)
    const cmd = `ffmpeg -y -i "${audioPath}" -ss ${startTime} -t ${CHUNK_DURATION_SEC} -vn -acodec copy "${chunkPath}"`;
    
    try {
      await execAsync(cmd);
      chunkPaths.push(chunkPath);
      console.log(`[Transcribe] Created chunk ${i + 1}/${numChunks}`);
    } catch (error) {
      console.error(`Error creating chunk ${i}:`, error);
      // Try with re-encoding as fallback
      const fallbackCmd = `ffmpeg -y -i "${audioPath}" -ss ${startTime} -t ${CHUNK_DURATION_SEC} -vn -c:a libopus -b:a 128k "${chunkPath}"`;
      await execAsync(fallbackCmd);
      chunkPaths.push(chunkPath);
    }
  }
  
  return chunkPaths;
}

async function transcribeChunk(chunkPath: string): Promise<string> {
  const audioBuffer = await readFile(chunkPath);
  const file = new File([audioBuffer], 'chunk.webm', { type: 'audio/webm' });
  
  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: 'whisper-1',
    language: 'en',
    response_format: 'text',
  });
  
  return transcription || '';
}

async function cleanupChunks(chunkDir: string, chunkPaths: string[], audioPath: string) {
  for (const chunkPath of chunkPaths) {
    // Don't delete the original audio file
    if (chunkPath !== audioPath) {
      try {
        await unlink(chunkPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  
  // Try to remove the temp directory if empty
  try {
    const remaining = await readdir(chunkDir);
    if (remaining.length === 0) {
      await unlink(chunkDir);
    }
  } catch (e) {
    // Ignore
  }
}

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
    
    // Create unique chunk directory for this transcription
    const chunkDir = path.join(CHUNK_DIR, recordingId);
    
    try {
      // Split audio into chunks
      const chunkPaths = await splitAudioIntoChunks(audioPath, chunkDir);
      
      console.log(`[Transcribe] Processing ${chunkPaths.length} chunk(s)`);
      
      // Transcribe each chunk and combine
      const transcriptParts: string[] = [];
      
      for (let i = 0; i < chunkPaths.length; i++) {
        console.log(`[Transcribe] Transcribing chunk ${i + 1}/${chunkPaths.length}`);
        const transcript = await transcribeChunk(chunkPaths[i]);
        transcriptParts.push(transcript.trim());
      }
      
      // Combine all transcripts
      const fullTranscript = transcriptParts.join(' ');
      
      // Get final duration
      const duration = await getAudioDuration(audioPath);
      
      // Update metadata with transcription
      metadata.transcript = fullTranscript;
      metadata.status = 'transcribed';
      metadata.transcribedAt = new Date().toISOString();
      metadata.duration = duration;
      metadata.chunkCount = chunkPaths.length;
      
      // Save updated metadata
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      // Cleanup temp chunks
      await cleanupChunks(chunkDir, chunkPaths, audioPath);
      
      console.log(`[Transcribe] Complete! ${fullTranscript.split(' ').length} words`);
      
      return NextResponse.json({
        message: 'Transcription completed',
        wordCount: fullTranscript.split(' ').length,
        duration,
        chunkCount: chunkPaths.length,
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
export const maxDuration = 600; // 10 minutes timeout for long lectures
