import { NextRequest, NextResponse } from 'next/server'
import { getTask, getSubtasks } from '@/lib/tasks'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    
    // Check parent task exists
    const parentTask = getTask(id)
    if (!parentTask) {
      return NextResponse.json({ error: 'Parent task not found' }, { status: 404 })
    }
    
    const subtasks = getSubtasks(id)
    
    return NextResponse.json({ 
      parentTask: {
        id: parentTask.id,
        title: parentTask.title
      },
      subtasks,
      count: subtasks.length
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
