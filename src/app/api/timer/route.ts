import { NextRequest, NextResponse } from 'next/server'
import { readTimerData, writeTimerData, TimerSession } from '@/lib/timer'

// GET - Get all timer sessions (optionally filter by week)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('weekStart')
  const weekEnd = searchParams.get('weekEnd')
  
  try {
    const data = readTimerData()
    let sessions = data.sessions
    
    // Filter by date range if provided
    if (weekStart && weekEnd) {
      const start = new Date(weekStart)
      const end = new Date(weekEnd)
      sessions = sessions.filter(s => {
        const sessionStart = new Date(s.startTime)
        return sessionStart >= start && sessionStart <= end
      })
    }
    
    // Sort by start time descending
    sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    
    return NextResponse.json({ 
      sessions,
      activeTimer: data.activeTimer
    })
  } catch (error) {
    console.error('Failed to get timer sessions:', error)
    return NextResponse.json({ sessions: [], activeTimer: null }, { status: 500 })
  }
}

// POST - Create a new completed session (manual entry)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, projectId, startTime, endTime } = body
    
    if (!name || !startTime || !endTime) {
      return NextResponse.json({ error: 'name, startTime, and endTime required' }, { status: 400 })
    }
    
    const data = readTimerData()
    const duration = Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000)
    
    const newSession: TimerSession = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      projectId: projectId || null,
      startTime,
      endTime,
      duration
    }
    
    data.sessions.unshift(newSession)
    writeTimerData(data)
    
    return NextResponse.json({ success: true, session: newSession })
  } catch (error) {
    console.error('Failed to create timer session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
