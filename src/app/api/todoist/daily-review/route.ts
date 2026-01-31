import { NextResponse } from 'next/server'
import * as todoist from '@/lib/todoist'
import { getAllTasks } from '@/lib/tasks'
import { getTodayEST } from '@/lib/timezone'

export async function GET() {
  try {
    const configured = await todoist.isConfigured()
    
    // Get Mission Control tasks due today
    const today = getTodayEST()
    const mcTasks = getAllTasks().filter(t => 
      t.dueDate === today && t.status !== 'done'
    )

    // Get Todoist tasks if configured
    let todoistTasks: { due: todoist.TodoistTask[], overdue: todoist.TodoistTask[] } | null = null
    if (configured) {
      todoistTasks = await todoist.getDailyReviewTasks()
    }

    return NextResponse.json({
      missionControl: {
        pending: mcTasks,
        count: mcTasks.length,
      },
      todoist: todoistTasks ? {
        due: todoistTasks.due,
        overdue: todoistTasks.overdue,
        dueCount: todoistTasks.due.length,
        overdueCount: todoistTasks.overdue.length,
        configured: true,
      } : {
        configured: false,
        message: 'Set TODOIST_API_TOKEN to enable Todoist sync',
      },
    })
  } catch (error) {
    console.error('Daily review error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, taskId, updates } = body

    switch (action) {
      case 'reschedule':
        if (!taskId || !updates?.newDate) {
          return NextResponse.json({ error: 'Missing taskId or newDate' }, { status: 400 })
        }
        const rescheduled = await todoist.rescheduleTask(taskId, updates.newDate)
        return NextResponse.json({ success: true, task: rescheduled })

      case 'complete':
        if (!taskId) {
          return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
        }
        await todoist.completeTask(taskId)
        return NextResponse.json({ success: true })

      case 'add-note':
        if (!taskId || !updates?.note) {
          return NextResponse.json({ error: 'Missing taskId or note' }, { status: 400 })
        }
        const noted = await todoist.addProgressNote(taskId, updates.note)
        return NextResponse.json({ success: true, task: noted })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Daily review action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
