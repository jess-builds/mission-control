import { NextRequest, NextResponse } from 'next/server'
import { getAllTasks, createTask } from '@/lib/tasks'

export async function GET() {
  const tasks = getAllTasks()
  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, status, assignee, tags, dueDate } = await request.json()
    
    if (!title || !assignee) {
      return NextResponse.json({ error: 'Title and assignee are required' }, { status: 400 })
    }
    
    const task = createTask(title, assignee, tags || [], description, dueDate, status || 'backlog')
    
    return NextResponse.json(task)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
