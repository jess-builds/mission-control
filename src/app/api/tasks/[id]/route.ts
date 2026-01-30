import { NextRequest, NextResponse } from 'next/server'
import { getTask, updateTask, deleteTask } from '@/lib/tasks'
import { notifyJess, createTaskAssignedPayload } from '@/lib/notify-jess'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params
  const task = getTask(id)
  
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  
  return NextResponse.json(task)
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const updates = await request.json()
    
    // Get the task before update to check if assignee is changing
    const existingTask = getTask(id)
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    const wasAssignedToJess = existingTask.assignee === 'jess'
    const willBeAssignedToJess = updates.assignee === 'jess'
    
    const task = updateTask(id, updates)
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Notify Jess if task is being newly assigned to her
    if (!wasAssignedToJess && willBeAssignedToJess) {
      await notifyJess(createTaskAssignedPayload(task))
    }
    
    return NextResponse.json(task)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { id } = await params
  const success = deleteTask(id)
  
  if (!success) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  
  return NextResponse.json({ success: true })
}
