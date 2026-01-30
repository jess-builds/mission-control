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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recordingId } = await params;
  
  try {
    const recording = await findRecording(recordingId);
    
    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    const { data: metadata, path: metadataPath } = recording;
    
    if (!metadata.transcript) {
      return NextResponse.json({ 
        error: 'No transcript available',
        notes: '# Notes\n\nNo transcript available to generate notes from.'
      });
    }
    
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      // Generate basic structured notes without AI
      const basicNotes = generateBasicNotes(metadata.transcript);
      metadata.notes = basicNotes;
      metadata.notesGeneratedAt = new Date().toISOString();
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      return NextResponse.json({
        message: 'Basic notes generated (AI not configured)',
        notes: basicNotes
      });
    }
    
    // Use AI to generate proper notes
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert note-taker for college lectures. Create well-structured, comprehensive notes from the lecture transcript.

Your notes should:
1. Have a clear title and date
2. Use proper markdown headings (##, ###) for major topics
3. Include bullet points for key concepts
4. Highlight important terms in **bold**
5. Include any mentioned dates, deadlines, or assignments
6. Summarize key takeaways at the end
7. Be comprehensive but concise - capture all important information

Format the notes in clean markdown that will render beautifully.`
        },
        {
          role: 'user',
          content: `Create structured lecture notes from this transcript:\n\n${metadata.transcript}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const aiNotes = response.choices[0].message.content || generateBasicNotes(metadata.transcript);
    
    // Save notes to recording
    metadata.notes = aiNotes;
    metadata.notesGeneratedAt = new Date().toISOString();
    metadata.notesSource = 'ai';
    
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return NextResponse.json({
      message: 'Notes generated successfully',
      notes: aiNotes
    });
  } catch (error) {
    console.error('Error generating notes:', error);
    return NextResponse.json({
      error: 'Failed to generate notes',
      notes: '# Notes\n\nFailed to generate notes. Please try again.'
    }, { status: 500 });
  }
}

function generateBasicNotes(transcript: string): string {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  let notes = '# Lecture Notes\n\n';
  notes += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
  notes += '---\n\n';
  
  // Group into sections of ~5 sentences
  const sections: string[][] = [];
  let current: string[] = [];
  
  sentences.forEach((s, i) => {
    current.push(s.trim());
    if (current.length >= 5) {
      sections.push([...current]);
      current = [];
    }
  });
  if (current.length > 0) sections.push(current);
  
  sections.forEach((section, i) => {
    notes += `## Section ${i + 1}\n\n`;
    section.forEach(s => {
      notes += `- ${s}\n`;
    });
    notes += '\n';
  });
  
  notes += '---\n\n';
  notes += '*Note: These are auto-generated notes. Edit to improve.*\n';
  
  return notes;
}
