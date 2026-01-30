import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { 
  getReferenceDocument, 
  deleteReferenceDocument 
} from '@/lib/reference-documents'

interface Props {
  params: Promise<{ id: string; docId: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id, docId } = await params
  const document = getReferenceDocument(id, docId)
  
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }
  
  // Check if user wants to download the file
  const download = request.nextUrl.searchParams.get('download') === 'true'
  
  if (download) {
    // Return the actual file
    if (!fs.existsSync(document.filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }
    
    const fileBuffer = fs.readFileSync(document.filePath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.title}"`,
      },
    })
  }
  
  // Otherwise return document metadata
  return NextResponse.json({ document })
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { id, docId } = await params
  const success = deleteReferenceDocument(id, docId)
  
  if (!success) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }
  
  return NextResponse.json({ success: true })
}
