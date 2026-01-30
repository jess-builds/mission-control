import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ACTIVITY_FILE = path.join(process.cwd(), 'data', 'activity.json')

export interface Activity {
  id: string
  type: 'task_created' | 'task_completed' | 'task_updated' | 'medication_taken' | 'document_created' | 'document_updated' | 'journal_created' | 'project_note' | 'timer_started' | 'timer_stopped' | 'search' | 'setting_changed' | 'dashboard_action' | 'micro_task'
  title: string
  description?: string
  timestamp: string
  actor: 'armaan' | 'jess' | 'system'
  metadata?: Record<string, unknown>
}

function ensureFile() {
  const dir = path.dirname(ACTIVITY_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(ACTIVITY_FILE)) {
    fs.writeFileSync(ACTIVITY_FILE, JSON.stringify({ activities: [] }, null, 2))
  }
}

function readActivities(): Activity[] {
  ensureFile()
  const content = fs.readFileSync(ACTIVITY_FILE, 'utf-8')
  const data = JSON.parse(content)
  return data.activities || []
}

function writeActivities(activities: Activity[]): void {
  ensureFile()
  // Keep only last 100 activities
  const trimmed = activities.slice(0, 100)
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify({ activities: trimmed }, null, 2))
}

// GET - Retrieve recent activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    
    const activities = readActivities()
    return NextResponse.json({ activities: activities.slice(0, Math.min(limit, 100)) })
  } catch (error) {
    console.error('Failed to get activities:', error)
    return NextResponse.json({ activities: [] }, { status: 500 })
  }
}

// POST - Add a new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, description, actor = 'system', metadata } = body
    
    if (!type || !title) {
      return NextResponse.json({ error: 'type and title required' }, { status: 400 })
    }
    
    const activities = readActivities()
    const newActivity: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
      actor,
      metadata
    }
    
    // Add to beginning (most recent first)
    activities.unshift(newActivity)
    writeActivities(activities)
    
    return NextResponse.json({ success: true, activity: newActivity })
  } catch (error) {
    console.error('Failed to add activity:', error)
    return NextResponse.json({ error: 'Failed to add activity' }, { status: 500 })
  }
}
