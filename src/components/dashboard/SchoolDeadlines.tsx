'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Calendar, AlertTriangle, BookOpen, Palette, Loader2 } from 'lucide-react'

interface Deadline {
  id: string
  title: string
  description?: string
  dueDate: string
  status: string
  course: string
  tags: string[]
}

export default function SchoolDeadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeadlines()
  }, [])

  const fetchDeadlines = async () => {
    try {
      const res = await fetch('/api/deadlines')
      if (res.ok) {
        const data = await res.json()
        setDeadlines(data.deadlines || [])
      }
    } catch (error) {
      console.error('Failed to fetch deadlines:', error)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const isOverdue = (date: string) => date < today
  const isDueToday = (date: string) => date === today
  const isDueSoon = (date: string) => {
    const due = new Date(date)
    const now = new Date()
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 3 && diff > 0
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    if (isDueToday(dateStr)) return 'Today'
    if (dateStr === new Date(Date.now() + 86400000).toISOString().split('T')[0]) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getCourseIcon = (course: string) => {
    if (course.includes('ANTH')) return BookOpen
    if (course.includes('FOUN')) return Palette
    return GraduationCap
  }

  const getStatusIndicator = (status: string) => {
    if (status === 'in-progress') {
      return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">In Progress</span>
    }
    return null
  }

  if (loading) {
    return (
      <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-[#4169E1]/10 to-transparent">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#4169E1]" />
            School Deadlines
          </h3>
          <p className="text-xs text-white/40 mt-1">SCAD - Spring 2026</p>
        </div>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-[#4169E1]/10 to-transparent">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-[#4169E1]" />
          School Deadlines
        </h3>
        <p className="text-xs text-white/40 mt-1">SCAD - Spring 2026 • Synced with Tasks</p>
      </div>

      {/* Deadlines List */}
      {deadlines.length === 0 ? (
        <div className="p-8 text-center">
          <GraduationCap className="h-8 w-8 text-[#228B22] mx-auto mb-2" />
          <p className="text-white/60 text-sm">All caught up! No pending deadlines 🎉</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {deadlines.map(deadline => {
            const Icon = getCourseIcon(deadline.course)
            const overdue = isOverdue(deadline.dueDate)
            const dueToday = isDueToday(deadline.dueDate)
            const dueSoon = isDueSoon(deadline.dueDate)
            
            return (
              <div 
                key={deadline.id}
                className={`p-4 transition-colors hover:bg-white/[0.02] ${
                  overdue ? 'bg-red-500/5' : dueToday ? 'bg-amber-500/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg
                    ${overdue ? 'bg-red-500/20 text-red-500' : 
                      dueToday ? 'bg-amber-500/20 text-amber-500' :
                      'bg-white/5 text-white/60'}
                  `}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-[#4169E1]">{deadline.course}</span>
                      {(overdue || dueToday) && (
                        <AlertTriangle className={`h-3 w-3 ${overdue ? 'text-red-500' : 'text-amber-500'}`} />
                      )}
                      {getStatusIndicator(deadline.status)}
                    </div>
                    <h4 className="font-medium text-white text-sm mt-0.5">{deadline.title}</h4>
                    {deadline.description && (
                      <p className="text-xs text-white/40 mt-1 line-clamp-1">{deadline.description}</p>
                    )}
                  </div>

                  <div className={`
                    text-xs font-medium px-2 py-1 rounded-full shrink-0
                    ${overdue ? 'bg-red-500/20 text-red-500' :
                      dueToday ? 'bg-amber-500/20 text-amber-500' :
                      dueSoon ? 'bg-[#4169E1]/20 text-[#4169E1]' :
                      'bg-white/5 text-white/40'}
                  `}>
                    {formatDate(deadline.dueDate)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
