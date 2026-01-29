import { NextRequest, NextResponse } from 'next/server'
import { getAllJournalEntries, searchJournalEntries, saveJournalEntry } from '@/lib/journal'

export async function GET(request: NextRequest) {
  const searchQuery = request.nextUrl.searchParams.get('search')
  
  if (searchQuery) {
    const entries = searchJournalEntries(searchQuery)
    return NextResponse.json(entries)
  }
  
  const entries = getAllJournalEntries()
  return NextResponse.json(entries)
}

export async function POST(request: NextRequest) {
  try {
    const { date, summary, content, topics } = await request.json()
    
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }
    
    saveJournalEntry(date, summary || '', content || '', topics || [])
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
