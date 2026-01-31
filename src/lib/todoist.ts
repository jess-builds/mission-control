/**
 * Todoist API integration
 * 
 * Requires TODOIST_API_TOKEN environment variable
 * Get yours at: https://todoist.com/help/articles/find-your-api-token
 */

import { getTodayEST } from '@/lib/timezone'

const TODOIST_API = 'https://api.todoist.com/rest/v2'

function getToken(): string | null {
  return process.env.TODOIST_API_TOKEN || null
}

export interface TodoistTask {
  id: string
  content: string
  description: string
  project_id: string
  section_id: string | null
  parent_id: string | null
  order: number
  priority: 1 | 2 | 3 | 4
  due: {
    date: string
    string: string
    datetime?: string
    timezone?: string
    is_recurring: boolean
  } | null
  url: string
  comment_count: number
  created_at: string
  creator_id: string
  assignee_id: string | null
  assigner_id: string | null
  labels: string[]
  is_completed: boolean
}

export interface TodoistProject {
  id: string
  name: string
  color: string
  parent_id: string | null
  order: number
  comment_count: number
  is_shared: boolean
  is_favorite: boolean
  is_inbox_project: boolean
  is_team_inbox: boolean
  view_style: string
  url: string
}

export async function isConfigured(): Promise<boolean> {
  return !!getToken()
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  if (!token) {
    throw new Error('Todoist API token not configured. Set TODOIST_API_TOKEN environment variable.')
  }

  const res = await fetch(`${TODOIST_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Todoist API error: ${res.status} - ${error}`)
  }

  // Handle empty responses (like DELETE)
  const text = await res.text()
  if (!text) return undefined as unknown as T
  return JSON.parse(text) as T
}

export async function getProjects(): Promise<TodoistProject[]> {
  return apiRequest<TodoistProject[]>('/projects')
}

export async function getTasks(filter?: string): Promise<TodoistTask[]> {
  const params = filter ? `?filter=${encodeURIComponent(filter)}` : ''
  return apiRequest<TodoistTask[]>(`/tasks${params}`)
}

export async function getTasksDueToday(): Promise<TodoistTask[]> {
  return getTasks('today | overdue')
}

export async function getTask(id: string): Promise<TodoistTask> {
  return apiRequest<TodoistTask>(`/tasks/${id}`)
}

export async function createTask(task: {
  content: string
  description?: string
  project_id?: string
  due_date?: string
  due_string?: string
  priority?: 1 | 2 | 3 | 4
  labels?: string[]
}): Promise<TodoistTask> {
  return apiRequest<TodoistTask>('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  })
}

export async function updateTask(
  id: string,
  updates: {
    content?: string
    description?: string
    due_date?: string
    due_string?: string
    priority?: 1 | 2 | 3 | 4
    labels?: string[]
  }
): Promise<TodoistTask> {
  return apiRequest<TodoistTask>(`/tasks/${id}`, {
    method: 'POST',
    body: JSON.stringify(updates),
  })
}

export async function completeTask(id: string): Promise<void> {
  await apiRequest<void>(`/tasks/${id}/close`, { method: 'POST' })
}

export async function reopenTask(id: string): Promise<void> {
  await apiRequest<void>(`/tasks/${id}/reopen`, { method: 'POST' })
}

export async function deleteTask(id: string): Promise<void> {
  await apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' })
}

/**
 * Get all tasks due today (or overdue) formatted for the daily review
 */
export async function getDailyReviewTasks(): Promise<{
  due: TodoistTask[]
  overdue: TodoistTask[]
}> {
  const today = getTodayEST()
  const tasks = await getTasksDueToday()
  
  return {
    due: tasks.filter(t => t.due?.date === today),
    overdue: tasks.filter(t => t.due?.date && t.due.date < today),
  }
}

/**
 * Reschedule a task to a new date
 */
export async function rescheduleTask(id: string, newDate: string): Promise<TodoistTask> {
  return updateTask(id, { due_date: newDate })
}

/**
 * Add a progress note to a task (prepends to description)
 */
export async function addProgressNote(id: string, note: string): Promise<TodoistTask> {
  const task = await getTask(id)
  const timestamp = getTodayEST()
  const newDescription = `[${timestamp}] ${note}\n\n${task.description || ''}`
  return updateTask(id, { description: newDescription.trim() })
}
