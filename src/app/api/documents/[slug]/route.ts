import { NextRequest, NextResponse } from 'next/server'
import { getDocument, saveDocument, deleteDocument } from '@/lib/documents'

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const document = getDocument(slug)
  
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }
  
  return NextResponse.json(document)
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params
    const { title, content, tags } = await request.json()
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    saveDocument(slug, title, content || '', tags || [])
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const success = deleteDocument(slug)
  
  if (!success) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }
  
  return NextResponse.json({ success: true })
}
