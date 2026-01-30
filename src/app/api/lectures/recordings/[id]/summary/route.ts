import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';

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
    
    // Load recording metadata
    const metadataPath = path.join(DATA_DIR, courseId, 'recordings', `${recordingId}.json`);
    if (!existsSync(metadataPath)) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    const metadataData = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataData);
    
    if (!metadata.transcript) {
      return NextResponse.json({ error: 'Recording not transcribed yet' }, { status: 400 });
    }
    
    // Check if already summarized
    if (metadata.summary) {
      return NextResponse.json({
        message: 'Recording already summarized',
        summary: metadata.summary
      });
    }
    
    // Load course info
    const coursePath = path.join(DATA_DIR, 'courses.json');
    const coursesData = await readFile(coursePath, 'utf-8');
    const courses = JSON.parse(coursesData);
    const course = courses.find((c: any) => c.id === courseId);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Generate summary using GPT-4
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating concise, useful lecture summaries for students.

Create a structured summary that includes:
1. **Main Topics**: Key concepts covered
2. **Important Details**: Specific facts, definitions, formulas
3. **Key Takeaways**: Most important things to remember
4. **Action Items**: Assignments, readings, or tasks mentioned
5. **Questions to Review**: 2-3 questions to test understanding

Keep it concise but comprehensive. Use bullet points and clear formatting.`
        },
        {
          role: 'user',
          content: `Course: ${course.name} (${course.code})
Recording Date: ${metadata.recordingDate}

Transcript:
${metadata.transcript}`
        }
      ],
      temperature: 0.5,
    });
    
    const summary = response.choices[0].message.content || '';
    
    // Store summary in metadata
    metadata.summary = summary;
    metadata.summarizedAt = new Date().toISOString();
    
    // Save updated metadata
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return NextResponse.json({
      message: 'Summary generated successfully',
      summary,
      metadata
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ 
      error: 'Failed to generate summary',
      details: String(error) 
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recordingId } = await params;
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  
  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }
  
  try {
    // Load recording metadata
    const metadataPath = path.join(DATA_DIR, courseId, 'recordings', `${recordingId}.json`);
    if (!existsSync(metadataPath)) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    const metadataData = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataData);
    
    if (!metadata.summary) {
      return NextResponse.json({ error: 'No summary available' }, { status: 404 });
    }
    
    return NextResponse.json({
      summary: metadata.summary,
      summarizedAt: metadata.summarizedAt
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch summary',
      details: String(error) 
    }, { status: 500 });
  }
}