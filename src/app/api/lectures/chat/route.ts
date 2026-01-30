import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';

const DATA_DIR = path.join(process.cwd(), 'data', 'lectures');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface ChatContext {
  level: 'recording' | 'course' | 'all';
  recordingId?: string;
  courseId?: string;
}

async function getContextData(context: ChatContext) {
  const contextData: any = {
    level: context.level,
    content: []
  };

  switch (context.level) {
    case 'recording':
      // Get single recording context
      if (!context.recordingId || !context.courseId) {
        throw new Error('recordingId and courseId required for recording context');
      }
      
      const recordingPath = path.join(DATA_DIR, context.courseId, 'recordings', `${context.recordingId}.json`);
      if (existsSync(recordingPath)) {
        const recording = JSON.parse(await readFile(recordingPath, 'utf-8'));
        contextData.content.push({
          type: 'recording',
          id: context.recordingId,
          date: recording.recordingDate,
          transcript: recording.transcript,
          summary: recording.summary,
          extractedTasks: recording.extractedTasks
        });
      }
      break;

    case 'course':
      // Get all recordings for a course
      if (!context.courseId) {
        throw new Error('courseId required for course context');
      }
      
      const courseRecordingsDir = path.join(DATA_DIR, context.courseId, 'recordings');
      if (existsSync(courseRecordingsDir)) {
        const files = await readFile(courseRecordingsDir);
        // In real implementation, would iterate through recording files
        // For now, we'll note this needs filesystem iteration
      }
      
      // Get course info
      const coursesPath = path.join(DATA_DIR, 'courses.json');
      if (existsSync(coursesPath)) {
        const courses = JSON.parse(await readFile(coursesPath, 'utf-8'));
        const course = courses.find((c: any) => c.id === context.courseId);
        if (course) {
          contextData.courseInfo = course;
        }
      }
      break;

    case 'all':
      // Get all courses and their recordings
      const allCoursesPath = path.join(DATA_DIR, 'courses.json');
      if (existsSync(allCoursesPath)) {
        const courses = JSON.parse(await readFile(allCoursesPath, 'utf-8'));
        contextData.courses = courses;
      }
      break;
  }

  return contextData;
}

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    
    if (!context || !context.level) {
      return NextResponse.json({ error: 'context with level is required' }, { status: 400 });
    }
    
    // Get context data based on level
    const contextData = await getContextData(context);
    
    // Build system prompt based on context level
    let systemPrompt = `You are a helpful AI assistant for a student's lecture notes and recordings.`;
    
    switch (context.level) {
      case 'recording':
        systemPrompt += `\n\nYou have access to a specific lecture recording. Answer questions based on this lecture content, providing specific references when possible.`;
        break;
      case 'course':
        systemPrompt += `\n\nYou have access to all recordings for the course "${contextData.courseInfo?.name || 'this course'}". Help the student understand concepts across multiple lectures.`;
        break;
      case 'all':
        systemPrompt += `\n\nYou have access to recordings from all courses. Help the student make connections across different subjects and find relevant information.`;
        break;
    }
    
    // Create messages for the chat
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context Data:\n${JSON.stringify(contextData, null, 2)}\n\nQuestion: ${message}` }
    ];
    
    // Get response from GPT-4
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const reply = response.choices[0].message.content || 'I couldn\'t generate a response.';
    
    return NextResponse.json({
      reply,
      context: context,
      usage: response.usage
    });
  } catch (error) {
    console.error('Error in lecture chat:', error);
    return NextResponse.json({ 
      error: 'Failed to process chat request',
      details: String(error) 
    }, { status: 500 });
  }
}