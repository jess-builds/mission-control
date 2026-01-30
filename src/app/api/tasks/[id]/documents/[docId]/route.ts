import { NextRequest, NextResponse } from 'next/server'
import { 
  getTaskDocument, 
  updateTaskDocument, 
  deleteTaskDocument 
} from '@/lib/task-documents'

interface Props {
  params: Promise<{ id: string; docId: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id, docId } = await params
  const document = getTaskDocument(id, docId)
  
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }
  
  return NextResponse.json({ document })
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id, docId } = await params
    const updates = await request.json()
    
    // Only allow updating title and content
    const allowedUpdates: { title?: string; content?: string } = {}
    if (updates.title !== undefined) allowedUpdates.title = updates.title
    if (updates.content !== undefined) allowedUpdates.content = updates.content
    
    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update. Allowed: title, content' }, 
        { status: 400 }
      )
    }
    
    const document = updateTaskDocument(id, docId, allowedUpdates)
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, document })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { id, docId } = await params
  const success = deleteTaskDocument(id, docId)
  
  if (!success) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }
  
  return NextResponse.json({ success: true })
}
