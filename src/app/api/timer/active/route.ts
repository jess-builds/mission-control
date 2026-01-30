import { NextRequest, NextResponse } from 'next/server'
import { readTimerData, writeTimerData, TimerSession } from '@/lib/timer'

// GET - Get active timer
export async function GET() {
  try {
    const data = readTimerData()
    return NextResponse.json({ activeTimer: data.activeTimer })
  } catch (error) {
    console.error('Failed to get active timer:', error)
    return NextResponse.json({ activeTimer: null }, { status: 500 })
  }
}

// POST - Start a new timer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, projectId } = body
    
    const data = readTimerData()
    
    // If there's an existing active timer, stop it first
    if (data.activeTimer) {
      const endTime = new Date().toISOString()
      const duration = Math.floor(
        (new Date(endTime).getTime() - new Date(data.activeTimer.startTime).getTime()) / 1000
      )
      
      const completedSession: TimerSession = {
        id: data.activeTimer.id,
        name: data.activeTimer.name,
        projectId: data.activeTimer.projectId,
        startTime: data.activeTimer.startTime,
        endTime,
        duration
      }
      
      data.sessions.unshift(completedSession)
    }
    
    // Start new timer
    data.activeTimer = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || 'Untitled',
      projectId: projectId || null,
      startTime: new Date().toISOString()
    }
    
    writeTimerData(data)
    
    return NextResponse.json({ success: true, activeTimer: data.activeTimer })
  } catch (error) {
    console.error('Failed to start timer:', error)
    return NextResponse.json({ error: 'Failed to start timer' }, { status: 500 })
  }
}

// DELETE - Stop the active timer
export async function DELETE() {
  try {
    const data = readTimerData()
    
    if (!data.activeTimer) {
      return NextResponse.json({ error: 'No active timer' }, { status: 400 })
    }
    
    const endTime = new Date().toISOString()
    const duration = Math.floor(
      (new Date(endTime).getTime() - new Date(data.activeTimer.startTime).getTime()) / 1000
    )
    
    const completedSession: TimerSession = {
      id: data.activeTimer.id,
      name: data.activeTimer.name,
      projectId: data.activeTimer.projectId,
      startTime: data.activeTimer.startTime,
      endTime,
      duration
    }
    
    data.sessions.unshift(completedSession)
    data.activeTimer = null
    
    writeTimerData(data)
    
    return NextResponse.json({ success: true, session: completedSession })
  } catch (error) {
    console.error('Failed to stop timer:', error)
    return NextResponse.json({ error: 'Failed to stop timer' }, { status: 500 })
  }
}

// PATCH - Update the active timer (name/project)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, projectId } = body
    
    const data = readTimerData()
    
    if (!data.activeTimer) {
      return NextResponse.json({ error: 'No active timer' }, { status: 400 })
    }
    
    if (name !== undefined) data.activeTimer.name = name
    if (projectId !== undefined) data.activeTimer.projectId = projectId
    
    writeTimerData(data)
    
    return NextResponse.json({ success: true, activeTimer: data.activeTimer })
  } catch (error) {
    console.error('Failed to update timer:', error)
    return NextResponse.json({ error: 'Failed to update timer' }, { status: 500 })
  }
}
