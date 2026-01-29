'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Timer, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TimerMode = 'focus' | 'break'

const FOCUS_TIME = 25 * 60 // 25 minutes
const BREAK_TIME = 5 * 60 // 5 minutes

export default function FocusTimer() {
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      // Timer completed
      if (mode === 'focus') {
        setSessions(prev => prev + 1)
        setMode('break')
        setTimeLeft(BREAK_TIME)
      } else {
        setMode('focus')
        setTimeLeft(FOCUS_TIME)
      }
      setIsRunning(false)
      // Could add notification sound here
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, mode])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setMode('focus')
    setTimeLeft(FOCUS_TIME)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = mode === 'focus' 
    ? ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100
    : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
      {/* Progress ring background */}
      <div 
        className={`absolute inset-0 opacity-10 transition-all duration-1000
          ${mode === 'focus' ? 'bg-[#4169E1]' : 'bg-[#228B22]'}`}
        style={{
          clipPath: `polygon(0 ${100 - progress}%, 100% ${100 - progress}%, 100% 100%, 0 100%)`
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            {mode === 'focus' ? (
              <>
                <Timer className="h-4 w-4 text-[#4169E1]" />
                Focus Time
              </>
            ) : (
              <>
                <Coffee className="h-4 w-4 text-[#228B22]" />
                Break Time
              </>
            )}
          </h3>
          <span className="text-xs text-white/40">
            {sessions} session{sessions !== 1 ? 's' : ''} today
          </span>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className={`
            text-5xl font-mono font-bold
            ${mode === 'focus' ? 'text-[#4169E1]' : 'text-[#228B22]'}
          `}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={resetTimer}
            className="border-white/10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={toggleTimer}
            className={`
              px-8
              ${mode === 'focus' 
                ? 'bg-[#4169E1] hover:bg-[#4169E1]/80' 
                : 'bg-[#228B22] hover:bg-[#228B22]/80'}
            `}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
