import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const TASKS_FILE = path.join(process.cwd(), 'data', 'tasks.json')
const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads')

export type ReferenceUploader = 'jess' | 'armaan'

export interface ReferenceDocument {
  id: string
  title: string
  type: 'reference'
  filePath: string
  mimeType: string
  uploadedBy: ReferenceUploader
  uploadedAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: string
  assignee: string
  tags: string[]
  dueDate?: string
  documents?: unknown[]
  referenceDocuments?: ReferenceDocument[]
  createdAt: string
  updatedAt: string
}

interface TasksData {
  tasks: Task[]
}

function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

function readTasksData(): TasksData {
  if (!fs.existsSync(TASKS_FILE)) {
    return { tasks: [] }
  }
  const content = fs.readFileSync(TASKS_FILE, 'utf-8')
  return JSON.parse(content)
}

function writeTasksData(data: TasksData): void {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2))
}

export function getReferenceDocuments(taskId: string): ReferenceDocument[] | null {
  const data = readTasksData()
  const task = data.tasks.find(t => t.id === taskId)
  if (!task) return null
  return task.referenceDocuments || []
}

export function getReferenceDocument(taskId: string, docId: string): ReferenceDocument | null {
  const data = readTasksData()
  const task = data.tasks.find(t => t.id === taskId)
  if (!task) return null
  const docs = task.referenceDocuments || []
  return docs.find(d => d.id === docId) || null
}

export async function createReferenceDocument(
  taskId: string,
  file: File,
  uploadedBy: ReferenceUploader
): Promise<ReferenceDocument | null> {
  ensureUploadsDir()
  
  const data = readTasksData()
  const taskIndex = data.tasks.findIndex(t => t.id === taskId)
  
  if (taskIndex === -1) return null
  
  const now = new Date().toISOString()
  const docId = `ref-${uuidv4()}`
  
  // Generate safe filename with doc id prefix to avoid collisions
  const safeFilename = `${docId}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const filePath = path.join(UPLOADS_DIR, safeFilename)
  
  // Write file to disk
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filePath, buffer)
  
  const newDocument: ReferenceDocument = {
    id: docId,
    title: file.name,
    type: 'reference',
    filePath: filePath,
    mimeType: file.type || 'application/octet-stream',
    uploadedBy,
    uploadedAt: now
  }
  
  if (!data.tasks[taskIndex].referenceDocuments) {
    data.tasks[taskIndex].referenceDocuments = []
  }
  
  data.tasks[taskIndex].referenceDocuments!.push(newDocument)
  data.tasks[taskIndex].updatedAt = now
  
  writeTasksData(data)
  return newDocument
}

export function deleteReferenceDocument(taskId: string, docId: string): boolean {
  const data = readTasksData()
  const taskIndex = data.tasks.findIndex(t => t.id === taskId)
  
  if (taskIndex === -1) return false
  
  const docs = data.tasks[taskIndex].referenceDocuments || []
  const docIndex = docs.findIndex(d => d.id === docId)
  
  if (docIndex === -1) return false
  
  // Delete the file from disk
  const doc = docs[docIndex]
  if (fs.existsSync(doc.filePath)) {
    fs.unlinkSync(doc.filePath)
  }
  
  data.tasks[taskIndex].referenceDocuments!.splice(docIndex, 1)
  data.tasks[taskIndex].updatedAt = new Date().toISOString()
  
  writeTasksData(data)
  return true
}

export function getReferenceDocumentFilePath(taskId: string, docId: string): string | null {
  const doc = getReferenceDocument(taskId, docId)
  if (!doc) return null
  return doc.filePath
}
