import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const TASKS_FILE = path.join(process.cwd(), 'data', 'tasks.json')

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'done'
export type Assignee = 'armaan' | 'jess'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  assignee: Assignee
  tags: string[]
  dueDate?: string
  createdAt: string
  updatedAt: string
}

function ensureFile() {
  const dir = path.dirname(TASKS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify({ tasks: [] }, null, 2))
  }
}

function readTasks(): Task[] {
  ensureFile()
  const content = fs.readFileSync(TASKS_FILE, 'utf-8')
  const data = JSON.parse(content)
  return data.tasks || []
}

function writeTasks(tasks: Task[]): void {
  ensureFile()
  fs.writeFileSync(TASKS_FILE, JSON.stringify({ tasks }, null, 2))
}

export function getAllTasks(): Task[] {
  return readTasks()
}

export function getTasksByStatus(status: TaskStatus): Task[] {
  return readTasks().filter(t => t.status === status)
}

export function getTasksByAssignee(assignee: Assignee): Task[] {
  return readTasks().filter(t => t.assignee === assignee)
}

export function getTasksByTag(tag: string): Task[] {
  return readTasks().filter(t => t.tags.includes(tag))
}

export function getTask(id: string): Task | null {
  return readTasks().find(t => t.id === id) || null
}

export function createTask(
  title: string,
  assignee: Assignee,
  tags: string[] = [],
  description?: string,
  dueDate?: string,
  status: TaskStatus = 'backlog'
): Task {
  const tasks = readTasks()
  const now = new Date().toISOString()
  
  const newTask: Task = {
    id: uuidv4(),
    title,
    description,
    status,
    assignee,
    tags,
    dueDate,
    createdAt: now,
    updatedAt: now
  }
  
  tasks.push(newTask)
  writeTasks(tasks)
  
  return newTask
}

export function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | null {
  const tasks = readTasks()
  const index = tasks.findIndex(t => t.id === id)
  
  if (index === -1) return null
  
  tasks[index] = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  writeTasks(tasks)
  return tasks[index]
}

export function deleteTask(id: string): boolean {
  const tasks = readTasks()
  const filtered = tasks.filter(t => t.id !== id)
  
  if (filtered.length === tasks.length) return false
  
  writeTasks(filtered)
  return true
}

export function moveTask(id: string, newStatus: TaskStatus): Task | null {
  return updateTask(id, { status: newStatus })
}

export function searchTasks(query: string): Task[] {
  const tasks = readTasks()
  const lowerQuery = query.toLowerCase()
  
  return tasks.filter(task => {
    const titleMatch = task.title.toLowerCase().includes(lowerQuery)
    const descMatch = task.description?.toLowerCase().includes(lowerQuery) || false
    const tagMatch = task.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    return titleMatch || descMatch || tagMatch
  })
}

export const AVAILABLE_TAGS = [
  'SCAD',
  'Clover',
  'Debtless',
  'Life Lab',
  'Content',
  'Personal',
  'Mission Control'
]

export const STATUS_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' }
]
