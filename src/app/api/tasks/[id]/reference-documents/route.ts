import { NextRequest, NextResponse } from 'next/server'
import { getTask, addReferenceDocument } from '@/lib/tasks'

interface Props {
  params: Promise<{ id: string }>
}

// GET /api/tasks/[id]/reference-documents - Get all reference documents for a task
export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params
  const task = getTask(id)
  
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  
  return NextResponse.json({ documents: task.referenceDocuments || [] })
}

// POST /api/tasks/[id]/reference-documents - Upload a reference document
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const { title, content, contentType } = await request.json()
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    
    const task = getTask(id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    const updatedTask = addReferenceDocument(
      id,
      title.trim(),
      content,
      'armaan' // Default uploader
    )
    
    if (!updatedTask) {
      return NextResponse.json({ error: 'Failed to add reference document' }, { status: 500 })
    }
    
    // Get the newly added document (last one in the array)
    const newDoc = updatedTask.referenceDocuments[updatedTask.referenceDocuments.length - 1]
    
    return NextResponse.json({ success: true, document: newDoc })
  } catch (error) {
    console.error('Failed to add reference document:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
