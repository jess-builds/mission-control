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
    // Find the recording
    const recording = await findRecording(recordingId);
    
    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    const { data: metadata, path: metadataPath } = recording;
    
    if (!metadata.transcript) {
      return NextResponse.json({ 
        message: 'Recording not transcribed yet',
        tasks: [],
        extractedTasks: []
      });
    }
    
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fail gracefully - no tasks extracted
      metadata.extractedTasks = [];
      metadata.tasksExtractedAt = new Date().toISOString();
      metadata.taskExtractionNote = 'No tasks could be extracted (API not configured)';
      
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      return NextResponse.json({
        message: 'No tasks extracted (API not configured)',
        tasks: [],
        extractedTasks: []
      });
    }
    
    // Dynamic import OpenAI only if needed
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Extract tasks using GPT-4
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting actionable tasks from lecture transcripts.
          
Extract:
- Homework assignments
- Project deadlines  
- Upcoming quizzes/exams
- Required readings
- Any other actionable items

Return JSON: { "tasks": [{ "task": "description", "dueDate": "YYYY-MM-DD or null", "priority": "high|normal|low" }] }

If no tasks found, return: { "tasks": [] }`
        },
        {
          role: 'user',
          content: `Transcript:\n${metadata.transcript}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const extractedData = JSON.parse(response.choices[0].message.content || '{"tasks": []}');
    const tasks = extractedData.tasks || [];
    
    // Store extracted tasks
    metadata.extractedTasks = tasks;
    metadata.tasksExtractedAt = new Date().toISOString();
    
    if (tasks.length === 0) {
      metadata.taskExtractionNote = 'No tasks found in this recording';
    }
    
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return NextResponse.json({
      message: tasks.length > 0 ? 'Tasks extracted successfully' : 'No tasks found',
      tasks,
      extractedTasks: tasks
    });
  } catch (error) {
    console.error('Error extracting tasks:', error);
    
    // Fail gracefully
    return NextResponse.json({
      message: 'Could not extract tasks',
      tasks: [],
      extractedTasks: [],
      note: 'Task extraction encountered an error. You can manually add tasks via chat.'
    });
  }
}
