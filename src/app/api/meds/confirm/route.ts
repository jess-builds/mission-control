import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { getTodayEST } from '@/lib/timezone'

const TRACKER_FILE = '/home/ubuntu/clawd/memory/meds-tracker.json'

function getTracker() {
  if (!fs.existsSync(TRACKER_FILE)) {
    return { medication: 'thyroid', framework: 'shit dont skip', log: {} }
  }
  return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'))
}

function saveTracker(tracker: Record<string, unknown>) {
  fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json()
    const today = date || getTodayEST()
    
    const tracker = getTracker()
    tracker.log[today] = {
      taken: true,
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      notes: 'Confirmed via Mission Control'
    }
    
    saveTracker(tracker)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to confirm meds:', error)
    return NextResponse.json({ error: 'Failed to confirm' }, { status: 500 })
  }
}
