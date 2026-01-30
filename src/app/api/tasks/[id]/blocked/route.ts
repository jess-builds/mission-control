import { NextRequest, NextResponse } from 'next/server'
import { getTask, updateTaskBlocked, TaskBlocked } from '@/lib/tasks'

interface Props {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Check task exists
    const existingTask = getTask(id)
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    let blocked: TaskBlocked | null = null
    
    // If blocked is true or has reason, construct the blocked object
    if (body.blocked === true || body.reason) {
      if (!body.reason) {
        return NextResponse.json(
          { error: 'Reason is required when marking task as blocked' },
          { status: 400 }
        )
      }
      
      blocked = {
        reason: body.reason,
        blockedAt: new Date().toISOString(),
        blockedBy: body.blockedBy || 'unknown'
      }
    }
    // If blocked is false or explicitly null, unblock the task
    // (blocked stays null, which unblocks the task)
    
    const task = updateTaskBlocked(id, blocked)
    
    return NextResponse.json({ success: true, task })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
