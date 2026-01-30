import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'lectures');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  
  try {
    const recordingsDir = path.join(DATA_DIR, courseId, 'recordings');
    
    if (!existsSync(recordingsDir)) {
      return NextResponse.json([]);
    }
    
    // Read all JSON files in the recordings directory
    const files = await readdir(recordingsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    // Load all recording metadata
    const recordings = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(recordingsDir, file);
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data);
      })
    );
    
    // Sort by date (most recent first)
    recordings.sort((a, b) => {
      const dateA = new Date(a.date + 'T00:00:00Z').getTime();
      const dateB = new Date(b.date + 'T00:00:00Z').getTime();
      return dateB - dateA;
    });
    
    return NextResponse.json(recordings);
  } catch (error) {
    console.error('Error getting recordings:', error);
    return NextResponse.json({ error: 'Failed to get recordings' }, { status: 500 });
  }
}