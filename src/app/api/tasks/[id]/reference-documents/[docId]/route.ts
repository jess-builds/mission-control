import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { getTask, deleteReferenceDocumentById } from '@/lib/tasks'

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
  
  // Check if user wants to download the file
  const download = request.nextUrl.searchParams.get('download') === 'true'
  
  if (download) {
    // Return the actual file
    if (!fs.existsSync(doc.filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }
    
    const fileBuffer = fs.readFileSync(doc.filePath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Disposition': `attachment; filename="${doc.title}"`,
      },
    })
  }
  
  // Otherwise return document metadata
  return NextResponse.json({ document: doc })
}

// DELETE /api/tasks/[id]/reference-documents/[docId] - Delete a reference document
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id, docId } = await params
    
    const result = deleteReferenceDocumentById(id, docId)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // Delete the file from disk
    if (result.filePath && fs.existsSync(result.filePath)) {
      fs.unlinkSync(result.filePath)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete reference document:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
