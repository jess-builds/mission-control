import { NextRequest, NextResponse } from 'next/server'
import { getTask, updateTask } from '@/lib/tasks'

interface Props {
  params: Promise<{ id: string; docId: string }>
}

// GET /api/tasks/[id]/reference-documents/[docId] - Get a specific reference document
export async function GET(request: NextRequest, { params }: Props) {
  const { id, docId } = await params
  const task = getTask(id)
  
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  
  const doc = task.referenceDocuments?.find(d => d.id === docId)
  
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }
  
  return NextResponse.json({ document: doc })
}

// PUT /api/tasks/[id]/reference-documents/[docId] - Update a reference document
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id, docId } = await params
    const { title, content } = await request.json()
    
    const task = getTask(id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    const docIndex = task.referenceDocuments?.findIndex(d => d.id === docId) ?? -1
    
    if (docIndex === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // Update the document
    const updatedDocs = [...(task.referenceDocuments || [])]
    updatedDocs[docIndex] = {
      ...updatedDocs[docIndex],
      title: title?.trim() || updatedDocs[docIndex].title,
      content: content ?? updatedDocs[docIndex].content
    }
    
    const updatedTask = updateTask(id, { referenceDocuments: updatedDocs })
    
    if (!updatedTask) {
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, document: updatedDocs[docIndex] })
  } catch (error) {
    console.error('Failed to update reference document:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id]/reference-documents/[docId] - Delete a reference document
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id, docId } = await params
    
    const task = getTask(id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    const docIndex = task.referenceDocuments?.findIndex(d => d.id === docId) ?? -1
    
    if (docIndex === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // Remove the document
    const updatedDocs = task.referenceDocuments?.filter(d => d.id !== docId) || []
    
    const updatedTask = updateTask(id, { referenceDocuments: updatedDocs })
    
    if (!updatedTask) {
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete reference document:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
