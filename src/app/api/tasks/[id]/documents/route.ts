import { NextRequest, NextResponse } from 'next/server'
import { 
  getTaskDocuments, 
  createTaskDocument,
  DocumentType,
  DocumentAuthor
} from '@/lib/task-documents'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params
  const documents = getTaskDocuments(id)
  
  if (documents === null) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  
  return NextResponse.json({ documents })
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const { title, type, content, createdBy } = await request.json()
    
    if (!title || !type || !content || !createdBy) {
      return NextResponse.json(
        { error: 'title, type, content, and createdBy are required' }, 
        { status: 400 }
      )
    }
    
    // Validate type
    if (type !== 'output' && type !== 'handoff') {
      return NextResponse.json(
        { error: 'type must be "output" or "handoff"' }, 
        { status: 400 }
      )
    }
    
    // Validate createdBy
    if (createdBy !== 'jess' && createdBy !== 'armaan') {
      return NextResponse.json(
        { error: 'createdBy must be "jess" or "armaan"' }, 
        { status: 400 }
      )
    }
    
    const document = createTaskDocument(
      id,
      title,
      type as DocumentType,
      content,
      createdBy as DocumentAuthor
    )
    
    if (!document) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, document }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
