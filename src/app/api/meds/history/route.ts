import { NextResponse } from 'next/server'
import fs from 'fs'

const TRACKER_FILE = '/home/ubuntu/clawd/memory/meds-tracker.json'

interface MedLog {
  taken: boolean
  confirmed: boolean
  confirmedAt?: string
  notes?: string
}

interface Tracker {
  medication: string
  framework: string
  log: Record<string, MedLog>
}

function getTracker(): Tracker {
  if (!fs.existsSync(TRACKER_FILE)) {
    return { medication: 'thyroid', framework: 'shit dont skip', log: {} }
  }
  return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'))
}

export async function GET() {
  try {
    const tracker = getTracker()
    
    // Return all log entries sorted by date (most recent first)
    const entries = Object.entries(tracker.log)
      .map(([date, data]) => ({
        date,
        ...data
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
    
    return NextResponse.json({
      medication: tracker.medication,
      entries
    })
  } catch (error) {
    console.error('Failed to get med history:', error)
    return NextResponse.json({ entries: [] }, { status: 500 })
  }
}
