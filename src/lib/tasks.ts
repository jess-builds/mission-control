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

// Sync todos from journal entries
export function syncJournalTodos(): { added: number; updated: number } {
  const journalDir = '/home/ubuntu/clawd/memory'
  let added = 0
  let updated = 0
  
  if (!fs.existsSync(journalDir)) return { added, updated }
  
  const tasks = readTasks()
  const files = fs.readdirSync(journalDir).filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
  
  for (const file of files) {
    const date = file.replace('.md', '')
    const content = fs.readFileSync(path.join(journalDir, file), 'utf-8')
    
    // Find all todo items: - [ ] or - [x]
    const todoRegex = /^- \[([ x])\] (.+)$/gm
    let match
    
    while ((match = todoRegex.exec(content)) !== null) {
      const isComplete = match[1] === 'x'
      const todoText = match[2].trim()
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/\*([^*]+)\*$/, '($1)') // Convert trailing italic to parentheses (for tags like *Clover*)
      
      // Extract tag if present (text in parentheses at end)
      const tagMatch = todoText.match(/\(([^)]+)\)$/)
      const tag = tagMatch ? tagMatch[1] : null
      const title = tagMatch ? todoText.replace(/\s*\([^)]+\)$/, '').trim() : todoText
      
      // Check if task already exists (by title match)
      const existingTask = tasks.find(t => 
        t.title.toLowerCase() === title.toLowerCase() ||
        t.title.toLowerCase().includes(title.toLowerCase().slice(0, 30))
      )
      
      if (existingTask) {
        // Update status if changed
        const newStatus = isComplete ? 'done' : existingTask.status
        if (existingTask.status !== newStatus && isComplete) {
          updateTask(existingTask.id, { status: 'done' })
          updated++
        }
      } else {
        // Create new task
        const tags: string[] = []
        if (tag) {
          // Map common tag variations
          const tagMap: Record<string, string> = {
            'clover': 'Clover',
            'scad': 'SCAD',
            'debtless': 'Debtless',
            'life lab': 'Life Lab',
            'lifelab': 'Life Lab',
            'content': 'Content',
            'personal': 'Personal',
            'mission control': 'Mission Control'
          }
          const normalizedTag = tagMap[tag.toLowerCase()] || tag
          tags.push(normalizedTag)
        }
        
        createTask(
          title,
          'armaan', // Default assignee
          tags,
          `From journal: ${date}`,
          undefined,
          isComplete ? 'done' : 'todo'
        )
        added++
      }
    }
  }
  
  return { added, updated }
}
