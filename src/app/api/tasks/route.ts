import { NextRequest, NextResponse } from 'next/server'
import { getAllTasks, createTask, searchTasks, getSubtasks } from '@/lib/tasks'
import { notifyJess, createTaskAssignedPayload } from '@/lib/notify-jess'

export async function GET(request: NextRequest) {
  const searchQuery = request.nextUrl.searchParams.get('search')
  const assigneeFilter = request.nextUrl.searchParams.get('assignee')
  const statusFilter = request.nextUrl.searchParams.get('status')
  const parentTaskFilter = request.nextUrl.searchParams.get('parentTask')
  
  let tasks = getAllTasks()
  
  // Apply search filter
  if (searchQuery) {
    tasks = searchTasks(searchQuery)
  }
  
  // Apply assignee filter
  if (assigneeFilter) {
    tasks = tasks.filter(t => t.assignee === assigneeFilter)
  }
  
  // Apply status filter
  if (statusFilter) {
    tasks = tasks.filter(t => t.status === statusFilter)
  }
  
  // Apply parentTask filter (for getting subtasks)
  if (parentTaskFilter) {
    tasks = getSubtasks(parentTaskFilter)
  }
  
  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      status, 
      priority,
      assignee, 
      tags, 
      dueDate,
      parentTask,
      blocked,
      recurring,
      completionCriteria
    } = body
    
    if (!title || !assignee) {
      return NextResponse.json({ error: 'Title and assignee are required' }, { status: 400 })
    }
    
    const task = createTask({
      title,
      assignee,
      tags: tags || [],
      description,
      dueDate,
      status: status || 'backlog',
      priority: priority || 'normal',
      parentTask: parentTask || null,
      blocked: blocked || null,
      recurring: recurring || null,
      completionCriteria: completionCriteria || null
    })
    
    // Notify Jess if task is assigned to her
    if (task.assignee === 'jess') {
      await notifyJess(createTaskAssignedPayload(task))
    }
    
    return NextResponse.json(task)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
