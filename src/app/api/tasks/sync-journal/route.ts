import { NextResponse } from 'next/server'
import { syncJournalTodos } from '@/lib/tasks'

export async function POST() {
  try {
    const result = syncJournalTodos()
    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Failed to sync journal todos:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const result = syncJournalTodos()
    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Failed to sync journal todos:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
