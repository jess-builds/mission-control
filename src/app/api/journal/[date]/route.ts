import { NextRequest, NextResponse } from 'next/server'
import { getJournalEntry, saveJournalEntry } from '@/lib/journal'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params
  const entry = getJournalEntry(date)
  
  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }
  
  return NextResponse.json(entry)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params
    const { content } = await request.json()
    
    if (content === undefined) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    
    saveJournalEntry(date, '', content, [])
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
