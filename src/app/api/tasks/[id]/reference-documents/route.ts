import { NextRequest, NextResponse } from 'next/server'
import { getTask, addReferenceDocument } from '@/lib/tasks'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads')

function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

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
    
    const task = getTask(id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
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
    
    ensureUploadsDir()
    
    // Generate safe filename with unique id prefix to avoid collisions
    const fileId = uuidv4()
    const safeFilename = `${fileId}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const filePath = path.join(UPLOADS_DIR, safeFilename)
    
    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)
    
    const updatedTask = addReferenceDocument(
      id,
      file.name,
      filePath,
      file.type || 'application/octet-stream',
      uploadedBy
    )
    
    if (!updatedTask) {
      // Clean up the file if task update failed
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return NextResponse.json({ error: 'Failed to add reference document' }, { status: 500 })
    }
    
    // Get the newly added document (last one in the array)
    const newDoc = updatedTask.referenceDocuments[updatedTask.referenceDocuments.length - 1]
    
    return NextResponse.json({ success: true, document: newDoc }, { status: 201 })
  } catch (error) {
    console.error('Failed to add reference document:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
