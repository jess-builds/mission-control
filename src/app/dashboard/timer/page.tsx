'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Play, 
  Square, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Calendar,
  Trash2,
  X,
  Copy
} from 'lucide-react'

// Project definitions matching ProjectCards.tsx
const PROJECTS = [
  { id: 'debtless', name: 'Debtless', color: 'bg-gradient-to-r from-emerald-500 to-teal-500', bgClass: 'bg-emerald-500/20 border-emerald-500/30', textClass: 'text-emerald-400' },
  { id: 'life-lab', name: 'Life Lab', color: 'bg-gradient-to-r from-purple-500 to-indigo-500', bgClass: 'bg-purple-500/20 border-purple-500/30', textClass: 'text-purple-400' },
  { id: 'clover', name: 'Clover Labs', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', bgClass: 'bg-blue-500/20 border-blue-500/30', textClass: 'text-blue-400' },
  { id: 'content', name: 'Content', color: 'bg-gradient-to-r from-red-500 to-orange-500', bgClass: 'bg-red-500/20 border-red-500/30', textClass: 'text-red-400' },
  { id: 'mission-control', name: 'Mission Control', color: 'bg-gradient-to-r from-[#4169E1] to-[#228B22]', bgClass: 'bg-[#4169E1]/20 border-[#4169E1]/30', textClass: 'text-[#4169E1]' },
  { id: 'school', name: 'School', color: 'bg-gradient-to-r from-amber-500 to-yellow-500', bgClass: 'bg-amber-500/20 border-amber-500/30', textClass: 'text-amber-400' },
]

interface TimerSession {
  id: string
  name: string
  projectId: string | null
  startTime: string
  endTime: string | null
  duration: number | null
}

interface ActiveTimer {
  id: string
  name: string
  projectId: string | null
  startTime: string
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function getWeekDates(date: Date): Date[] {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Start on Monday
  const monday = new Date(date)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

export default function TimerPage() {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [sessions, setSessions] = useState<TimerSession[]>([])
  const [timerName, setTimerName] = useState('')
  const [timerProject, setTimerProject] = useState<string>('')
  const [elapsed, setElapsed] = useState(0)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [loading, setLoading] = useState(true)
  
  // Edit modal state
  const [editingSession, setEditingSession] = useState<TimerSession | null>(null)
  const [editName, setEditName] = useState('')
  const [editProject, setEditProject] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editDuration, setEditDuration] = useState('')

  const weekDates = getWeekDates(currentWeek)
  const weekStart = weekDates[0]
  const weekEnd = new Date(weekDates[6])
  weekEnd.setHours(23, 59, 59, 999)

  // Fetch timer data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/timer?weekStart=${weekStart.toISOString()}&weekEnd=${weekEnd.toISOString()}`)
      const data = await res.json()
      setSessions(data.sessions || [])
      setActiveTimer(data.activeTimer || null)
      if (data.activeTimer) {
        setTimerName(data.activeTimer.name)
        setTimerProject(data.activeTimer.projectId || '')
      }
    } catch (e) {
      console.error('Failed to fetch timer data:', e)
    } finally {
      setLoading(false)
    }
  }, [weekStart.toISOString(), weekEnd.toISOString()])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Update elapsed time
  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0)
      return
    }
    
    const updateElapsed = () => {
      const start = new Date(activeTimer.startTime).getTime()
      const now = Date.now()
      setElapsed(Math.floor((now - start) / 1000))
    }
    
    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [activeTimer])

  const startTimer = async () => {
    try {
      const res = await fetch('/api/timer/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: timerName || 'Untitled', 
          projectId: timerProject || null 
        })
      })
      const data = await res.json()
      if (data.success) {
        setActiveTimer(data.activeTimer)
        fetchData()
      }
    } catch (e) {
      console.error('Failed to start timer:', e)
    }
  }

  const stopTimer = async () => {
    try {
      const res = await fetch('/api/timer/active', { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setActiveTimer(null)
        setTimerName('')
        setTimerProject('')
        fetchData()
      }
    } catch (e) {
      console.error('Failed to stop timer:', e)
    }
  }

  const updateActiveTimer = async (name: string, projectId: string) => {
    if (!activeTimer) return
    try {
      await fetch('/api/timer/active', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, projectId: projectId || null })
      })
    } catch (e) {
      console.error('Failed to update timer:', e)
    }
  }

  const deleteSession = async (id: string) => {
    try {
      await fetch(`/api/timer/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (e) {
      console.error('Failed to delete session:', e)
    }
  }

  const goToToday = () => setCurrentWeek(new Date())
  const goToPrevWeek = () => {
    const d = new Date(currentWeek)
    d.setDate(d.getDate() - 7)
    setCurrentWeek(d)
  }
  const goToNextWeek = () => {
    const d = new Date(currentWeek)
    d.setDate(d.getDate() + 7)
    setCurrentWeek(d)
  }

  const getProjectById = (id: string | null) => PROJECTS.find(p => p.id === id)

  // Open edit modal
  const openEditModal = (session: TimerSession) => {
    setEditingSession(session)
    setEditName(session.name)
    setEditProject(session.projectId || '')
    const start = new Date(session.startTime)
    const end = session.endTime ? new Date(session.endTime) : new Date()
    setEditStartTime(start.toTimeString().slice(0, 5))
    setEditEndTime(end.toTimeString().slice(0, 5))
    setEditDuration(session.duration ? formatDuration(session.duration) : '00:00:00')
  }

  // Close edit modal
  const closeEditModal = () => {
    setEditingSession(null)
  }

  // Save session edits
  const saveSessionEdit = async () => {
    if (!editingSession) return
    
    try {
      const startDate = new Date(editingSession.startTime)
      const [startH, startM] = editStartTime.split(':').map(Number)
      startDate.setHours(startH, startM, 0, 0)
      
      const endDate = new Date(startDate)
      const [endH, endM] = editEndTime.split(':').map(Number)
      endDate.setHours(endH, endM, 0, 0)
      
      // Handle overnight sessions
      if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 1)
      }
      
      const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
      
      await fetch(`/api/timer/${editingSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          projectId: editProject || null,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          duration
        })
      })
      
      fetchData()
      closeEditModal()
    } catch (e) {
      console.error('Failed to save session:', e)
    }
  }

  // Duplicate session
  const duplicateSession = async () => {
    if (!editingSession) return
    
    try {
      await fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingSession.name,
          projectId: editingSession.projectId,
          startTime: new Date().toISOString(),
          endTime: null,
          duration: null
        })
      })
      
      // Start a new timer with the same name/project
      setTimerName(editingSession.name)
      setTimerProject(editingSession.projectId || '')
      closeEditModal()
      startTimer()
    } catch (e) {
      console.error('Failed to duplicate session:', e)
    }
  }

  // Calculate aggregate time for a project
  const getAggregateTime = (projectId: string | null, taskName: string) => {
    const total = sessions
      .filter(s => s.projectId === projectId && s.name === taskName)
      .reduce((acc, s) => acc + (s.duration || 0), 0)
    return formatDuration(total)
  }

  // Update end time when duration changes
  const handleDurationChange = (newDuration: string) => {
    setEditDuration(newDuration)
    
    // Parse duration (HH:MM:SS or HH:MM)
    const parts = newDuration.split(':').map(Number)
    if (parts.length >= 2 && !parts.some(isNaN)) {
      const hours = parts[0] || 0
      const mins = parts[1] || 0
      const totalMins = hours * 60 + mins
      
      // Calculate new end time from start time + duration
      const [startH, startM] = editStartTime.split(':').map(Number)
      const startTotalMins = startH * 60 + startM
      let endTotalMins = startTotalMins + totalMins
      
      // Handle day overflow
      if (endTotalMins >= 24 * 60) endTotalMins -= 24 * 60
      
      const endH = Math.floor(endTotalMins / 60)
      const endM = endTotalMins % 60
      setEditEndTime(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`)
    }
  }

  // Update duration when times change
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setEditStartTime(value)
    } else {
      setEditEndTime(value)
    }
    
    // Recalculate duration
    const startTime = type === 'start' ? value : editStartTime
    const endTime = type === 'end' ? value : editEndTime
    
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      let durationMins = (endH * 60 + endM) - (startH * 60 + startM)
      if (durationMins < 0) durationMins += 24 * 60
      const h = Math.floor(durationMins / 60)
      const m = durationMins % 60
      setEditDuration(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`)
    }
  }
  
  // Get sessions for a specific day
  const getSessionsForDay = (date: Date) => {
    return sessions.filter(s => {
      const sessionDate = new Date(s.startTime)
      return isSameDay(sessionDate, date)
    })
  }

  // Calculate position and height for a time block
  const getBlockStyle = (session: TimerSession) => {
    const start = new Date(session.startTime)
    const end = session.endTime ? new Date(session.endTime) : new Date()
    
    const startHour = start.getHours() + start.getMinutes() / 60
    const endHour = end.getHours() + end.getMinutes() / 60
    const duration = endHour - startHour
    
    return {
      top: `${(startHour / 24) * 100}%`,
      height: `${Math.max((duration / 24) * 100, 2)}%`, // Minimum 2% height for visibility
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const today = new Date()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4169E1]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Time Tracking</h1>
          <p className="text-sm text-white/50 mt-1">Track your work sessions and visualize your week</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Clock className="h-4 w-4" />
          <span>
            {sessions.reduce((acc, s) => acc + (s.duration || 0), 0) > 0 
              ? `${Math.round(sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 3600 * 10) / 10}h this week`
              : 'No time tracked this week'}
          </span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          {/* Timer Name Input */}
          <input
            type="text"
            value={timerName}
            onChange={(e) => {
              setTimerName(e.target.value)
              if (activeTimer) {
                updateActiveTimer(e.target.value, timerProject)
              }
            }}
            placeholder="What are you working on?"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4169E1]/50 transition-colors"
          />
          
          {/* Project Dropdown */}
          <select
            value={timerProject}
            onChange={(e) => {
              setTimerProject(e.target.value)
              if (activeTimer) {
                updateActiveTimer(timerName, e.target.value)
              }
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4169E1]/50 transition-colors min-w-[180px]"
          >
            <option value="">No project</option>
            {PROJECTS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Elapsed Time */}
          <div className={`font-mono text-3xl font-bold min-w-[140px] text-center ${activeTimer ? 'text-[#4169E1]' : 'text-white/30'}`}>
            {formatDuration(elapsed)}
          </div>

          {/* Start/Stop Button */}
          {activeTimer ? (
            <button
              onClick={stopTimer}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Square className="h-5 w-5 fill-current" />
              Stop
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="flex items-center gap-2 bg-[#4169E1] hover:bg-[#4169E1]/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Play className="h-5 w-5 fill-current" />
              Start
            </button>
          )}
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#4169E1]" />
            <span className="font-medium text-white">
              {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevWeek}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-white/60" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex">
          {/* Time Column */}
          <div className="w-16 flex-shrink-0 border-r border-white/5">
            <div className="h-12 border-b border-white/5"></div>
            {hours.map(hour => (
              <div key={hour} className="h-10 border-b border-white/5 px-2 flex items-start pt-0.5">
                <span className="text-[10px] text-white/30">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Days */}
          {weekDates.map((date, dayIndex) => {
            const daySessions = getSessionsForDay(date)
            const isToday = isSameDay(date, today)
            
            return (
              <div key={dayIndex} className="flex-1 border-r border-white/5 last:border-r-0">
                {/* Day Header */}
                <div className={`h-12 border-b border-white/5 flex flex-col items-center justify-center ${isToday ? 'bg-[#4169E1]/10' : ''}`}>
                  <span className="text-[10px] text-white/40 uppercase">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={`text-sm font-medium ${isToday ? 'text-[#4169E1]' : 'text-white/80'}`}>
                    {date.getDate()}
                  </span>
                </div>
                
                {/* Hours Grid */}
                <div className="relative">
                  {hours.map(hour => (
                    <div 
                      key={hour} 
                      className={`h-10 border-b border-white/5 ${isToday ? 'bg-[#4169E1]/5' : ''}`}
                    ></div>
                  ))}
                  
                  {/* Time Blocks */}
                  {daySessions.map(session => {
                    const project = getProjectById(session.projectId)
                    const style = getBlockStyle(session)
                    
                    return (
                      <div
                        key={session.id}
                        onClick={() => openEditModal(session)}
                        className={`absolute left-1 right-1 rounded-md px-1.5 py-0.5 overflow-hidden cursor-pointer group border hover:ring-2 hover:ring-white/20 transition-all ${project?.bgClass || 'bg-white/10 border-white/20'}`}
                        style={style}
                      >
                        <p className={`text-[10px] font-medium truncate ${project?.textClass || 'text-white/80'}`}>
                          {session.name}
                        </p>
                        {session.duration && session.duration >= 1800 && (
                          <p className="text-[9px] text-white/40 truncate">
                            {formatDuration(session.duration)}
                          </p>
                        )}
                        
                        {/* Delete button on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSession(session.id)
                          }}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-500/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-2.5 w-2.5 text-white" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Sessions List */}
      {sessions.length > 0 && (
        <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-medium text-white">This Week&apos;s Sessions</h3>
          </div>
          <div className="divide-y divide-white/5">
            {sessions.slice(0, 10).map(session => {
              const project = getProjectById(session.projectId)
              return (
                <div 
                  key={session.id} 
                  onClick={() => openEditModal(session)}
                  className="p-4 flex items-center justify-between hover:bg-white/[0.02] group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${project?.color || 'bg-white/20'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-white">{session.name}</p>
                      <p className="text-xs text-white/40">
                        {project?.name || 'No project'} • {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-mono text-white/80">
                        {session.duration ? formatDuration(session.duration) : '—'}
                      </p>
                      <p className="text-xs text-white/40">
                        {formatTime(new Date(session.startTime))} - {session.endTime ? formatTime(new Date(session.endTime)) : 'Running'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id)
                      }}
                      className="p-2 text-white/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeEditModal}>
          <div 
            className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={duplicateSession}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white"
                  title="Duplicate & start new timer"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    deleteSession(editingSession.id)
                    closeEditModal()
                  }}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-white/60 hover:text-red-500"
                  title="Delete session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Task Name */}
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Task Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4169E1]/50 transition-colors"
                />
              </div>

              {/* Project */}
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Project</label>
                <select
                  value={editProject}
                  onChange={(e) => setEditProject(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4169E1]/50 transition-colors"
                >
                  <option value="">No project</option>
                  {PROJECTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Aggregate Time */}
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/40 mb-1">Total time on this task</p>
                <p className="text-lg font-mono font-bold text-[#4169E1]">
                  {getAggregateTime(editingSession.projectId, editingSession.name)}
                </p>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Start Time</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => handleTimeChange('start', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4169E1]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">End Time</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => handleTimeChange('end', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4169E1]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Duration (editable - updates end time) */}
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Duration</label>
                <input
                  type="text"
                  value={editDuration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  placeholder="HH:MM:SS"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-[#4169E1]/50 transition-colors"
                />
                <p className="text-xs text-white/30 mt-1">Edit to adjust end time automatically</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-white/5">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSessionEdit}
                className="px-6 py-2 bg-[#4169E1] hover:bg-[#4169E1]/80 text-white rounded-lg font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
