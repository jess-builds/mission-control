'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Calendar, AlertTriangle, BookOpen, Palette } from 'lucide-react'

interface Deadline {
  id: string
  course: string
  courseCode: string
  title: string
  dueDate: string
  status: 'pending' | 'in-progress' | 'submitted'
  notes?: string
}

// Static deadlines for now - could be API-driven later
const SCHOOL_DEADLINES: Deadline[] = [
  {
    id: '1',
    course: 'ANTH 106',
    courseCode: 'Language, Culture, Society',
    title: 'Ethnographic Journal - Week 4',
    dueDate: '2026-01-29',
    status: 'in-progress',
    notes: 'Archaeology of a Menu - Tim Hortons'
  },
  {
    id: '2',
    course: 'ANTH 106',
    courseCode: 'Language, Culture, Society', 
    title: 'Journal Responses (2)',
    dueDate: '2026-01-31',
    status: 'pending',
    notes: 'Respond to 2 classmates'
  },
  {
    id: '3',
    course: 'ANTH 106',
    courseCode: 'Language, Culture, Society',
    title: 'Language Badge - Giriyama',
    dueDate: '2026-01-30',
    status: 'pending'
  },
  {
    id: '4',
    course: 'FOUN 220',
    courseCode: 'Drawing: Light & Shadow',
    title: 'Project 1 - Charcoal Still Life',
    dueDate: '2026-01-29',
    status: 'pending',
    notes: 'Dramatic lighting'
  }
]

export default function SchoolDeadlines() {
  const today = new Date().toISOString().split('T')[0]
  
  const sortedDeadlines = [...SCHOOL_DEADLINES].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

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

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-[#4169E1]/10 to-transparent">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-[#4169E1]" />
          School Deadlines
        </h3>
        <p className="text-xs text-white/40 mt-1">SCAD - Spring 2026</p>
      </div>

      {/* Deadlines List */}
      <div className="divide-y divide-white/5">
        {sortedDeadlines.map(deadline => {
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#4169E1]">{deadline.course}</span>
                    {(overdue || dueToday) && (
                      <AlertTriangle className={`h-3 w-3 ${overdue ? 'text-red-500' : 'text-amber-500'}`} />
                    )}
                  </div>
                  <h4 className="font-medium text-white text-sm mt-0.5">{deadline.title}</h4>
                  {deadline.notes && (
                    <p className="text-xs text-white/40 mt-1">{deadline.notes}</p>
                  )}
                </div>

                <div className={`
                  text-xs font-medium px-2 py-1 rounded-full
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
    </div>
  )
}
