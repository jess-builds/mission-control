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
    
    // Load course info to get course name
    const coursePath = path.join(DATA_DIR, 'courses.json');
    const coursesData = await readFile(coursePath, 'utf-8');
    const courses = JSON.parse(coursesData);
    const course = courses.find((c: any) => c.id === courseId);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Extract tasks using GPT-4
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting actionable tasks, assignments, and deadlines from lecture transcripts.
          
Extract all:
- Homework assignments
- Project deadlines
- Upcoming quizzes/exams
- Required readings
- Any other actionable items mentioned by the professor

For each task, provide:
- title: Brief descriptive title
- description: More detailed description if available
- dueDate: Due date in YYYY-MM-DD format (if mentioned)
- type: assignment|exam|quiz|reading|project|other
- priority: high|normal|low (based on importance/urgency)

Return as JSON array.`
        },
        {
          role: 'user',
          content: `Course: ${course.name} (${course.code})
Recording Date: ${metadata.recordingDate}

Transcript:
${metadata.transcript}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const extractedData = JSON.parse(response.choices[0].message.content || '{"tasks": []}');
    const tasks = extractedData.tasks || [];
    
    // Store extracted tasks in metadata
    metadata.extractedTasks = tasks;
    metadata.tasksExtractedAt = new Date().toISOString();
    
    // Save updated metadata
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Create actual tasks in the system for high priority items
    if (tasks.length > 0) {
      const highPriorityTasks = tasks.filter((t: any) => t.priority === 'high' || t.dueDate);
      
      for (const task of highPriorityTasks) {
        try {
          await fetch('http://localhost:3001/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `[${course.code}] ${task.title}`,
              description: task.description || '',
              status: 'todo',
              priority: task.priority || 'normal',
              assignee: 'armaan',
              tags: ['SCAD', course.code],
              dueDate: task.dueDate,
              referenceDocuments: [`lecture:${recordingId}`]
            })
          });
        } catch (error) {
          console.error('Error creating task:', error);
        }
      }
    }
    
    return NextResponse.json({
      message: 'Tasks extracted successfully',
      tasks,
      metadata
    });
  } catch (error) {
    console.error('Error extracting tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to extract tasks',
      details: String(error) 
    }, { status: 500 });
  }
}