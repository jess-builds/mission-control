import { NextRequest, NextResponse } from 'next/server'
import { notifyJess, type NotificationPayload } from '@/lib/notify-jess'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as NotificationPayload
    
    // Validate payload has required type
    if (!payload.type) {
      return NextResponse.json(
        { error: 'Payload must include a type field' },
        { status: 400 }
      )
    }
    
    // Validate payload type
    const validTypes = ['project_note', 'task_note', 'task_assigned']
    if (!validTypes.includes(payload.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Add timestamp if not present
    if (!payload.timestamp) {
      payload.timestamp = new Date().toISOString()
    }
    
    // Send notification to Jess
    const result = await notifyJess(payload)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send notification', details: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in /api/jess/notify:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
