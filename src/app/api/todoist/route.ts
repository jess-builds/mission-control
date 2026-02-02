import { NextRequest, NextResponse } from 'next/server'
import * as todoist from '@/lib/todoist'

export async function GET() {
  try {
    const configured = await todoist.isConfigured()
    if (!configured) {
      return NextResponse.json(
        { error: 'Todoist not configured', configured: false },
        { status: 503 }
      )
    }

    const tasks = await todoist.getTasksDueToday()
    return NextResponse.json({ tasks, configured: true })
  } catch (error) {
    console.error('Todoist API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const configured = await todoist.isConfigured()
    if (!configured) {
      return NextResponse.json(
        { error: 'Todoist not configured', configured: false },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { content, description, project_id, due_date, due_string, priority, labels } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const task = await todoist.createTask({
      content,
      description,
      project_id,
      due_date,
      due_string,
      priority,
      labels
    })

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error('Todoist create task error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
