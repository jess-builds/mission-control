import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'timer-sessions.json')

export interface TimerSession {
  id: string
  name: string
  projectId: string | null
  startTime: string
  endTime: string | null
  duration: number | null
}

export interface ActiveTimer {
  id: string
  name: string
  projectId: string | null
  startTime: string
}

export interface TimerData {
  sessions: TimerSession[]
  activeTimer: ActiveTimer | null
}

function ensureFile() {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ sessions: [], activeTimer: null }, null, 2))
  }
}

export function readTimerData(): TimerData {
  ensureFile()
  const content = fs.readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(content)
}

export function writeTimerData(data: TimerData): void {
  ensureFile()
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}
