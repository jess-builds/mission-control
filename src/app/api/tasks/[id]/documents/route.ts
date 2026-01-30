import { NextRequest, NextResponse } from 'next/server'
import { getTask, addTaskDocument } from '@/lib/tasks'

interface Props {
  params: Promise<{ id: string }>
}

// GET /api/tasks/[id]/documents - Get all output documents for a task
export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params
  const task = getTask(id)
  
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  
  return NextResponse.json({ documents: task.documents || [] })
}

// POST /api/tasks/[id]/documents - Create an output or handoff document
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const { title, content, type } = await request.json()
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    
    if (!type || !['output', 'handoff'].includes(type)) {
      return NextResponse.json({ error: 'Type must be "output" or "handoff"' }, { status: 400 })
    }
    
    const task = getTask(id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    const updatedTask = addTaskDocument(
      id,
      title.trim(),
      type,
      content,
      'jess' // Default creator
    )
    
    if (!updatedTask) {
      return NextResponse.json({ error: 'Failed to add document' }, { status: 500 })
    }
    
    // Get the newly added document (last one in the array)
    const newDoc = updatedTask.documents[updatedTask.documents.length - 1]
    
    return NextResponse.json({ success: true, document: newDoc })
  } catch (error) {
    console.error('Failed to add document:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
