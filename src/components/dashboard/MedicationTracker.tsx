'use client'

import { useState, useEffect } from 'react'
import { Pill, Check, AlertTriangle, Calendar, History } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Get today's date in EST/EDT (client-side)
function getTodayEST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })
}

interface MedStatus {
  taken: boolean
  confirmedAt?: string
}

interface MedEntry {
  date: string
  taken: boolean
  confirmedAt?: string
}

export default function MedicationTracker() {
  const [status, setStatus] = useState<MedStatus>({ taken: false })
  const [history, setHistory] = useState<MedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const today = getTodayEST()

  useEffect(() => {
    fetchStatus()
    fetchHistory()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/meds/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch med status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/meds/history')
      if (res.ok) {
        const data = await res.json()
        setHistory(data.entries || [])
      }
    } catch (error) {
      console.error('Failed to fetch med history:', error)
    }
  }

  const confirmTaken = async () => {
    try {
      const res = await fetch('/api/meds/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today })
      })
      if (res.ok) {
        setStatus({ taken: true, confirmedAt: new Date().toISOString() })
        // Log activity
        await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'medication_taken',
            title: 'Thyroid medication taken',
            description: 'Daily hypothyroidism medication confirmed',
            actor: 'armaan'
          })
        })
        fetchHistory()
      }
    } catch (error) {
      console.error('Failed to confirm meds:', error)
    }
  }

  // Generate last 30 days for heatmap
  const generateHeatmapDays = () => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })
      const entry = history.find(e => e.date === dateStr)
      days.push({
        date: dateStr,
        taken: entry?.taken || false,
        dayOfWeek: date.getDay(),
        dayNum: date.getDate()
      })
    }
    return days
  }

  const heatmapDays = generateHeatmapDays()
  const streakCount = history.filter(e => e.taken).length

  if (loading) {
    return (
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
        <div className="animate-pulse h-20 bg-white/5 rounded-lg" />
      </div>
    )
  }

  return (
    <div className={`
      relative overflow-hidden rounded-2xl transition-all
      ${status.taken 
        ? 'bg-[#228B22]/10 border border-[#228B22]/30' 
        : 'bg-amber-500/10 border border-amber-500/30'
      }
    `}>
      {/* Background glow */}
      <div className={`
        absolute -inset-px rounded-2xl blur-xl opacity-30
        ${status.taken ? 'bg-[#228B22]' : 'bg-amber-500'}
      `} />
      
      {/* Main Status */}
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`
              p-3 rounded-xl
              ${status.taken 
                ? 'bg-[#228B22]/20 text-[#228B22]' 
                : 'bg-amber-500/20 text-amber-500'
              }
            `}>
              {status.taken ? <Check className="h-6 w-6" /> : <Pill className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                Thyroid Medication
                {!status.taken && <AlertTriangle className="h-4 w-4 text-amber-500" />}
              </h3>
              <p className={`text-sm ${status.taken ? 'text-[#228B22]' : 'text-amber-500'}`}>
                {status.taken 
                  ? `Taken today ✓` 
                  : "Shit don't skip!"
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-white/60 hover:text-white"
            >
              <History className="h-4 w-4 mr-1" />
              {showHistory ? 'Hide' : 'Log'}
            </Button>
            {!status.taken && (
              <Button
                onClick={confirmTaken}
                className="bg-[#228B22] hover:bg-[#228B22]/80 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark as Taken
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded History Section */}
      {showHistory && (
        <div className="relative border-t border-white/10 p-4 bg-black/20">
          {/* 30-Day Heatmap */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-white/40" />
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Last 30 Days ({streakCount} taken)
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {heatmapDays.map((day) => (
                <div
                  key={day.date}
                  className={`
                    w-4 h-4 rounded-sm transition-colors cursor-default
                    ${day.taken 
                      ? 'bg-[#228B22] hover:bg-[#228B22]/80' 
                      : day.date <= today 
                        ? 'bg-red-500/30 hover:bg-red-500/50' 
                        : 'bg-white/5'
                    }
                  `}
                  title={`${day.date}: ${day.taken ? 'Taken ✓' : day.date <= today ? 'Missed' : 'Future'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-[#228B22]" />
                <span>Taken</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-red-500/30" />
                <span>Missed</span>
              </div>
            </div>
          </div>

          {/* Recent Log */}
          <div>
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Recent Log</span>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {history.slice(0, 7).map((entry) => (
                <div key={entry.date} className="flex items-center justify-between text-sm py-1">
                  <span className="text-white/70">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className={entry.taken ? 'text-[#228B22]' : 'text-red-400'}>
                    {entry.taken ? '✓ Taken' : '✗ Missed'}
                  </span>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-white/40 text-sm">No history yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
