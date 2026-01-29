'use client'

import { useState, useEffect } from 'react'
import { Pill, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MedStatus {
  taken: boolean
  confirmedAt?: string
}

export default function MedicationTracker() {
  const [status, setStatus] = useState<MedStatus>({ taken: false })
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchStatus()
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

  const confirmTaken = async () => {
    try {
      const res = await fetch('/api/meds/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today })
      })
      if (res.ok) {
        setStatus({ taken: true, confirmedAt: new Date().toISOString() })
      }
    } catch (error) {
      console.error('Failed to confirm meds:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
        <div className="animate-pulse h-20 bg-white/5 rounded-lg" />
      </div>
    )
  }

  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-6 transition-all
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
      
      <div className="relative flex items-center justify-between">
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
              Daily Medication
              {!status.taken && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </h3>
            <p className={`text-sm ${status.taken ? 'text-[#228B22]' : 'text-amber-500'}`}>
              {status.taken 
                ? `Taken today ✓` 
                : "Not confirmed yet — shit don't skip!"
              }
            </p>
          </div>
        </div>
        
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
  )
}
