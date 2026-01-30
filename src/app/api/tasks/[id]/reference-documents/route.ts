import { NextRequest, NextResponse } from 'next/server'
import { 
  getReferenceDocuments, 
  createReferenceDocument,
  ReferenceUploader
} from '@/lib/reference-documents'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params
  const documents = getReferenceDocuments(id)
  
  if (documents === null) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  
  return NextResponse.json({ documents })
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadedBy = formData.get('uploadedBy') as string | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'file is required' }, 
        { status: 400 }
      )
    }
    
    if (!uploadedBy) {
      return NextResponse.json(
        { error: 'uploadedBy is required' }, 
        { status: 400 }
      )
    }
    
    // Validate uploadedBy
    if (uploadedBy !== 'jess' && uploadedBy !== 'armaan') {
      return NextResponse.json(
        { error: 'uploadedBy must be "jess" or "armaan"' }, 
        { status: 400 }
      )
    }
    
    const document = await createReferenceDocument(
      id,
      file,
      uploadedBy as ReferenceUploader
    )
    
    if (!document) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, document }, { status: 201 })
  } catch (error) {
    console.error('Error uploading reference document:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
