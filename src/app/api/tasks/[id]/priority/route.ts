import { NextRequest, NextResponse } from 'next/server'
import { getTask, updateTaskPriority, TaskPriority } from '@/lib/tasks'

interface Props {
  params: Promise<{ id: string }>
}

const VALID_PRIORITIES: TaskPriority[] = ['urgent', 'high', 'normal', 'low']

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const { priority } = await request.json()
    
    // Validate priority
    if (!priority || !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Check task exists
    const existingTask = getTask(id)
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    const task = updateTaskPriority(id, priority)
    
    return NextResponse.json({ success: true, task })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
