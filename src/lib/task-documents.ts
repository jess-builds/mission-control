import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const TASKS_FILE = path.join(process.cwd(), 'data', 'tasks.json')

export type DocumentType = 'output' | 'handoff'
export type DocumentAuthor = 'jess' | 'armaan'

export interface TaskDocument {
  id: string
  title: string
  type: DocumentType
  content: string
  createdBy: DocumentAuthor
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: string
  assignee: string
  tags: string[]
  dueDate?: string
  documents?: TaskDocument[]
  createdAt: string
  updatedAt: string
}

interface TasksData {
  tasks: Task[]
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

export function getTaskDocuments(taskId: string): TaskDocument[] | null {
  const data = readTasksData()
  const task = data.tasks.find(t => t.id === taskId)
  if (!task) return null
  return task.documents || []
}

export function getTaskDocument(taskId: string, documentId: string): TaskDocument | null {
  const data = readTasksData()
  const task = data.tasks.find(t => t.id === taskId)
  if (!task) return null
  const documents = task.documents || []
  return documents.find(d => d.id === documentId) || null
}

export function createTaskDocument(
  taskId: string,
  title: string,
  type: DocumentType,
  content: string,
  createdBy: DocumentAuthor
): TaskDocument | null {
  const data = readTasksData()
  const taskIndex = data.tasks.findIndex(t => t.id === taskId)
  
  if (taskIndex === -1) return null
  
  const now = new Date().toISOString()
  const newDocument: TaskDocument = {
    id: `doc-${uuidv4()}`,
    title,
    type,
    content,
    createdBy,
    createdAt: now,
    updatedAt: now
  }
  
  if (!data.tasks[taskIndex].documents) {
    data.tasks[taskIndex].documents = []
  }
  
  data.tasks[taskIndex].documents!.push(newDocument)
  data.tasks[taskIndex].updatedAt = now
  
  writeTasksData(data)
  return newDocument
}

export function updateTaskDocument(
  taskId: string,
  documentId: string,
  updates: Partial<Pick<TaskDocument, 'title' | 'content'>>
): TaskDocument | null {
  const data = readTasksData()
  const taskIndex = data.tasks.findIndex(t => t.id === taskId)
  
  if (taskIndex === -1) return null
  
  const documents = data.tasks[taskIndex].documents || []
  const docIndex = documents.findIndex(d => d.id === documentId)
  
  if (docIndex === -1) return null
  
  const now = new Date().toISOString()
  
  data.tasks[taskIndex].documents![docIndex] = {
    ...data.tasks[taskIndex].documents![docIndex],
    ...updates,
    updatedAt: now
  }
  
  data.tasks[taskIndex].updatedAt = now
  
  writeTasksData(data)
  return data.tasks[taskIndex].documents![docIndex]
}

export function deleteTaskDocument(taskId: string, documentId: string): boolean {
  const data = readTasksData()
  const taskIndex = data.tasks.findIndex(t => t.id === taskId)
  
  if (taskIndex === -1) return false
  
  const documents = data.tasks[taskIndex].documents || []
  const docIndex = documents.findIndex(d => d.id === documentId)
  
  if (docIndex === -1) return false
  
  data.tasks[taskIndex].documents!.splice(docIndex, 1)
  data.tasks[taskIndex].updatedAt = new Date().toISOString()
  
  writeTasksData(data)
  return true
}
