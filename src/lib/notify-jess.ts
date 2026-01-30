import { exec } from 'child_process'
import { promisify } from 'util'
import type { Task, TaskNote } from './tasks'

const execAsync = promisify(exec)

export interface ProjectNotePayload {
  type: 'project_note'
  project: string
  content: string
  timestamp: string
  noteId?: string
}

export interface TaskNotePayload {
  type: 'task_note'
  task: {
    id: string
    title: string
    status: string
    assignee: string
  }
  note: {
    content: string
    author: string
  }
  timestamp: string
}

export interface TaskAssignedPayload {
  type: 'task_assigned'
  task: {
    id: string
    title: string
    description?: string
    dueDate?: string
    tags: string[]
    status: string
  }
  timestamp: string
}

export type NotificationPayload = ProjectNotePayload | TaskNotePayload | TaskAssignedPayload

function escapeMessage(text: string): string {
  // Escape for shell command
  return text.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$')
}

function formatNotification(payload: NotificationPayload): string {
  switch (payload.type) {
    case 'project_note':
      return `📝 **Note from Armaan** (Project: ${payload.project})

${payload.content}`

    case 'task_note':
      return `📝 **Note on Task** — ${payload.task.title}

From: ${payload.note.author}
Status: ${payload.task.status}

${payload.note.content}`

    case 'task_assigned':
      const task = payload.task
      const parts = [
        `✅ **Task Assigned to You**`,
        ``,
        `**Title:** ${task.title}`
      ]
      
      if (task.description) {
        parts.push(`**Description:** ${task.description}`)
      }
      
      if (task.dueDate) {
        parts.push(`**Due:** ${task.dueDate}`)
      }
      
      if (task.tags && task.tags.length > 0) {
        parts.push(`**Tags:** ${task.tags.join(', ')}`)
      }
      
      parts.push(`**Status:** ${task.status}`)
      
      return parts.join('\n')

    default:
      return `🔔 Notification: ${JSON.stringify(payload)}`
  }
}

export async function notifyJess(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const message = formatNotification(payload)
    const escapedMessage = escapeMessage(message)
    
    // Use clawdbot system event to notify Jess immediately
    const command = `clawdbot system event --text "${escapedMessage}" --mode now`
    
    await execAsync(command, { timeout: 10000 })
    
    return { success: true }
  } catch (error) {
    console.error('Failed to notify Jess:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Helper to create notification payload from a Task object
export function createTaskAssignedPayload(task: Task): TaskAssignedPayload {
  return {
    type: 'task_assigned',
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      tags: task.tags,
      status: task.status
    },
    timestamp: new Date().toISOString()
  }
}

export function createTaskNotePayload(task: Task, note: TaskNote): TaskNotePayload {
  return {
    type: 'task_note',
    task: {
      id: task.id,
      title: task.title,
      status: task.status,
      assignee: task.assignee
    },
    note: {
      content: note.content,
      author: note.author
    },
    timestamp: new Date().toISOString()
  }
}
