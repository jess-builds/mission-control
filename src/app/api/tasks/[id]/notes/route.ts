import { NextRequest, NextResponse } from 'next/server'
import { getTask, addNoteToTask, getTaskNotes, type Assignee } from '@/lib/tasks'
import { notifyJess, createTaskNotePayload } from '@/lib/notify-jess'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params
  const notes = getTaskNotes(id)
  
  if (notes === null) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  
  return NextResponse.json({ notes })
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const { content, author } = await request.json()
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    
    // Default author to 'armaan' if not specified
    const noteAuthor: Assignee = (author === 'jess') ? 'jess' : 'armaan'
    
    // Get the task first to check assignee
    const task = getTask(id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Add the note
    const note = addNoteToTask(id, noteAuthor, content)
    
    if (!note) {
      return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
    }
    
    // Notify Jess about all notes from Armaan (regardless of task assignment)
    if (noteAuthor !== 'jess') {
      // Refetch task to get updated state with the new note
      const updatedTask = getTask(id)
      if (updatedTask) {
        await notifyJess(createTaskNotePayload(updatedTask, note))
      }
    }
    
    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Error adding note:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
