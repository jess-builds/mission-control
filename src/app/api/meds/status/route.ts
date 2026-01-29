import { NextResponse } from 'next/server'
import fs from 'fs'

const TRACKER_FILE = '/home/ubuntu/clawd/memory/meds-tracker.json'

function getTracker() {
  if (!fs.existsSync(TRACKER_FILE)) {
    return { medication: 'thyroid', framework: 'shit dont skip', log: {} }
  }
  return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'))
}

export async function GET() {
  try {
    const tracker = getTracker()
    const today = new Date().toISOString().split('T')[0]
    const todayStatus = tracker.log[today] || { taken: false, confirmed: false }
    
    return NextResponse.json({
      taken: todayStatus.taken || todayStatus.confirmed,
      confirmedAt: todayStatus.confirmedAt
    })
  } catch (error) {
    console.error('Failed to get med status:', error)
    return NextResponse.json({ taken: false }, { status: 500 })
  }
}
