import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';

const DATA_DIR = path.join(process.cwd(), 'data', 'lectures');

// Clawdbot Gateway config (for @jess mentions)
const CLAWDBOT_URL = process.env.CLAWDBOT_GATEWAY_URL || 'http://127.0.0.1:18789';
const CLAWDBOT_TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || '';

// OpenAI client for regular questions (GPT-4o-mini - cheaper)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface ChatContext {
  level: 'recording' | 'course' | 'all';
  recordingId?: string;
  courseId?: string;
  transcript?: string;
}

async function getContextData(context: ChatContext) {
  const contextParts: string[] = [];

  try {
    switch (context.level) {
      case 'recording':
        if (context.transcript) {
          contextParts.push(`Current lecture transcript:\n${context.transcript.substring(0, 12000)}`);
        } else if (context.recordingId && context.courseId) {
          const recordingPath = path.join(DATA_DIR, context.courseId, 'recordings', `${context.recordingId}.json`);
          if (existsSync(recordingPath)) {
            const recording = JSON.parse(await readFile(recordingPath, 'utf-8'));
            if (recording.notes) contextParts.push(`Lecture notes:\n${recording.notes}`);
            if (recording.transcript) contextParts.push(`Transcript:\n${recording.transcript.substring(0, 10000)}`);
          }
        }
        break;

      case 'course':
        if (context.courseId) {
          const courseRecordingsDir = path.join(DATA_DIR, context.courseId, 'recordings');
          if (existsSync(courseRecordingsDir)) {
            const files = await readdir(courseRecordingsDir);
            const jsonFiles = files.filter(f => f.endsWith('.json')).slice(0, 3);
            
            for (const file of jsonFiles) {
              const recordingPath = path.join(courseRecordingsDir, file);
              const recording = JSON.parse(await readFile(recordingPath, 'utf-8'));
              let content = `\n--- Recording from ${recording.date} ---\n`;
              if (recording.notes) content += `Notes: ${recording.notes.substring(0, 1500)}\n`;
              if (recording.transcript) content += `Excerpt: ${recording.transcript.substring(0, 2000)}\n`;
              contextParts.push(content);
            }
          }
          
          const coursesPath = path.join(DATA_DIR, 'courses.json');
          if (existsSync(coursesPath)) {
            const courses = JSON.parse(await readFile(coursesPath, 'utf-8'));
            const course = courses.find((c: any) => c.id === context.courseId);
            if (course) {
              contextParts.unshift(`Course: ${course.name} (${course.code})`);
            }
          }
        }
        break;
    }
  } catch (error) {
    console.error('Error getting context data:', error);
  }

  return contextParts.join('\n\n');
}

// Check if message mentions @jess
function mentionsJess(message: string): boolean {
  return /@jess/i.test(message);
}

// Route through Clawdbot (Opus with tools)
async function routeThroughClawdbot(message: string, contextData: string): Promise<string> {
  let fullMessage = message;
  if (contextData) {
    fullMessage = `[Mission Control - Lecture Chat]\n\nContext from lecture recordings:\n${contextData}\n\n---\n\nArmaan's request: ${message}`;
  } else {
    fullMessage = `[Mission Control - Lecture Chat]\n\nArmaan's request: ${message}`;
  }
  
  const response = await fetch(`${CLAWDBOT_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLAWDBOT_TOKEN}`,
      'x-clawdbot-agent-id': 'main'
    },
    body: JSON.stringify({
      model: 'clawdbot:main',
      messages: [{ role: 'user', content: fullMessage }],
      user: 'mission-control-lectures'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Clawdbot API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I couldn't process that. Try again?";
}

// Use GPT-4o-mini directly (cheaper, no tools)
async function routeThroughCheapModel(message: string, contextData: string): Promise<string> {
  const systemPrompt = `You are Jess, Armaan's AI assistant helping with lecture notes. Be concise, helpful, and direct. You have access to lecture transcripts to answer questions.

If Armaan needs you to DO something (add tasks, make changes, execute actions), tell him to tag you with @jess to enable that.`;

  let userMessage = message;
  if (contextData) {
    userMessage = `Lecture context:\n${contextData}\n\n---\n\nQuestion: ${message}`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1500,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  });

  return response.choices[0]?.message?.content || "I couldn't generate a response.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    
    const ctx = context || { level: 'all' };
    const contextData = await getContextData(ctx);
    
    let reply: string;
    let routedThrough: 'sonnet' | 'jess';
    
    if (mentionsJess(message)) {
      // Route through Clawdbot (Opus with full tools)
      reply = await routeThroughClawdbot(message, contextData);
      routedThrough = 'jess';
    } else {
      // Use GPT-4o-mini directly (cheaper)
      reply = await routeThroughCheapModel(message, contextData);
      routedThrough = 'sonnet'; // label kept for UI
    }
    
    return NextResponse.json({
      reply,
      context: ctx,
      model: routedThrough
    });
  } catch (error) {
    console.error('Error in lecture chat:', error);
    
    return NextResponse.json({ 
      reply: "Sorry, I hit an error. Try again or tag @jess if you need me to do something.",
      error: true
    });
  }
}
