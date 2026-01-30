import { NextResponse } from 'next/server'
import { getAllTasks } from '@/lib/tasks'

export async function GET() {
  try {
    const tasks = getAllTasks()
    
    // Filter for SCAD tasks with due dates that are NOT done
    const deadlines = tasks
      .filter(task => 
        task.tags.some(tag => tag === 'SCAD' || tag.startsWith('ANTH') || tag.startsWith('FOUN')) &&
        task.dueDate &&
        task.status !== 'done'
      )
      .map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status,
        course: task.tags.find(t => t.startsWith('ANTH') || t.startsWith('FOUN')) || 'SCAD',
        tags: task.tags
      }))
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
    
    return NextResponse.json({ deadlines })
  } catch (error) {
    console.error('Failed to get deadlines:', error)
    return NextResponse.json({ deadlines: [] }, { status: 500 })
  }
}
