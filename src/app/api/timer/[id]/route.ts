import { NextRequest, NextResponse } from 'next/server'
import { readTimerData, writeTimerData } from '@/lib/timer'

// DELETE - Delete a specific session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = readTimerData()
    
    const index = data.sessions.findIndex(s => s.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    data.sessions.splice(index, 1)
    writeTimerData(data)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete session:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}

// PUT - Update a specific session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, projectId, startTime, endTime, duration } = body
    
    const data = readTimerData()
    
    const session = data.sessions.find(s => s.id === id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    if (name !== undefined) session.name = name
    if (projectId !== undefined) session.projectId = projectId
    if (startTime !== undefined) session.startTime = startTime
    if (endTime !== undefined) session.endTime = endTime
    if (duration !== undefined) session.duration = duration
    
    // Recalculate duration if not provided
    if (duration === undefined && session.startTime && session.endTime) {
      session.duration = Math.floor(
        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000
      )
    }
    
    writeTimerData(data)
    
    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error('Failed to update session:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

// PATCH - Alias for PUT
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context)
}
