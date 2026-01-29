import { NextResponse } from 'next/server'
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
