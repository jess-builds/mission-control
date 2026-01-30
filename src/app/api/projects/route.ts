import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getAllTasks } from '@/lib/tasks'
import { notifyJess, type ProjectNotePayload } from '@/lib/notify-jess'

const NOTES_FILE = path.join(process.cwd(), 'data', 'project-notes.json')

interface ProjectNote {
  id: string
  projectId: string
  message: string
  timestamp: string
  type: 'delegation' | 'note'
  status: 'pending' | 'acknowledged' | 'completed'
}

function ensureFile() {
  const dir = path.dirname(NOTES_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(NOTES_FILE)) {
    fs.writeFileSync(NOTES_FILE, JSON.stringify({ notes: [] }, null, 2))
  }
}

function readNotes(): ProjectNote[] {
  ensureFile()
  const content = fs.readFileSync(NOTES_FILE, 'utf-8')
  const data = JSON.parse(content)
  return data.notes || []
}

function writeNotes(notes: ProjectNote[]): void {
  ensureFile()
  fs.writeFileSync(NOTES_FILE, JSON.stringify({ notes }, null, 2))
}

// GET - Get project data with tasks and notes
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('id')
  
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
  }
  
  try {
    const tasks = getAllTasks()
    const notes = readNotes()
    
    // Map project IDs to task tags
    const projectTagMap: Record<string, string[]> = {
      'debtless': ['Debtless'],
      'life-lab': ['Life Lab'],
      'clover': ['Clover'],
      'content': ['Content'],
      'mission-control': ['Mission Control']
    }
    
    const tags = projectTagMap[projectId] || [projectId]
    
    // Filter tasks for this project
    const projectTasks = tasks.filter(task => 
      task.tags.some(tag => tags.includes(tag))
    )
    
    // Filter notes for this project
    const projectNotes = notes.filter(note => note.projectId === projectId)
    
    return NextResponse.json({
      tasks: projectTasks,
      notes: projectNotes
    })
  } catch (error) {
    console.error('Failed to get project data:', error)
    return NextResponse.json({ tasks: [], notes: [] }, { status: 500 })
  }
}

// POST - Add a note/delegation message for Jess
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, message, type = 'delegation' } = body
    
    if (!projectId || !message) {
      return NextResponse.json({ error: 'projectId and message required' }, { status: 400 })
    }
    
    const notes = readNotes()
    const newNote: ProjectNote = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      message,
      timestamp: new Date().toISOString(),
      type,
      status: 'pending'
    }
    
    notes.unshift(newNote)
    writeNotes(notes)
    
    // Notify Jess about the project note
    const projectNames: Record<string, string> = {
      'debtless': 'Debtless',
      'life-lab': 'Life Lab',
      'clover': 'Clover',
      'content': 'Content',
      'mission-control': 'Mission Control'
    }
    
    const notificationPayload: ProjectNotePayload = {
      type: 'project_note',
      project: projectNames[projectId] || projectId,
      content: message,
      timestamp: new Date().toISOString()
    }
    
    // Fire and forget - don't block the response
    notifyJess(notificationPayload).catch(err => {
      console.error('Failed to notify Jess about project note:', err)
    })
    
    // Also log to activity feed
    try {
      const activityFile = path.join(process.cwd(), 'data', 'activity.json')
      const activities = fs.existsSync(activityFile) 
        ? JSON.parse(fs.readFileSync(activityFile, 'utf-8')).activities || []
        : []
      
      activities.unshift({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'project_note',
        title: `Note for ${projectId}`,
        description: message.slice(0, 100) + (message.length > 100 ? '...' : ''),
        timestamp: new Date().toISOString(),
        actor: 'armaan',
        metadata: { projectId }
      })
      
      fs.writeFileSync(activityFile, JSON.stringify({ activities: activities.slice(0, 100) }, null, 2))
    } catch (e) {
      console.error('Failed to log activity:', e)
    }
    
    return NextResponse.json({ success: true, note: newNote })
  } catch (error) {
    console.error('Failed to add project note:', error)
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}
