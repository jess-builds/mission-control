'use client'

import { useState, useEffect } from 'react'
import { FileText, Check, Pill, MessageCircle, Loader2, Activity, Zap, Timer, Layout, ChevronDown, ChevronUp } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'task_created' | 'task_completed' | 'task_updated' | 'medication_taken' | 'document_created' | 'document_updated' | 'journal_created' | 'project_note' | 'timer_started' | 'timer_stopped' | 'search' | 'setting_changed' | 'dashboard_action' | 'micro_task'
  title: string
  description?: string
  timestamp: string
  actor: 'armaan' | 'jess' | 'system'
  metadata?: Record<string, unknown>
}

function getActivityIcon(type: ActivityItem['type']) {
  const className = "h-3 w-3"
  switch (type) {
    case 'task_completed':
      return <Check className={className} />
    case 'medication_taken':
      return <Pill className={className} />
    case 'document_created':
    case 'document_updated':
      return <FileText className={className} />
    case 'project_note':
      return <MessageCircle className={className} />
    case 'timer_started':
    case 'timer_stopped':
      return <Timer className={className} />
    case 'dashboard_action':
      return <Layout className={className} />
    case 'micro_task':
      return <Zap className={className} />
    default:
      return <Activity className={className} />
  }
}

function getActivityColor(type: ActivityItem['type']) {
  switch (type) {
    case 'task_completed':
      return 'bg-emerald-500'
    case 'medication_taken':
      return 'bg-green-500'
    case 'document_created':
    case 'document_updated':
      return 'bg-violet-500'
    case 'timer_started':
    case 'timer_stopped':
      return 'bg-rose-500'
    case 'dashboard_action':
    case 'micro_task':
      return 'bg-[#4169E1]'
    default:
      return 'bg-white/40'
  }
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffMins < 1) return 'Now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDate(activities: ActivityItem[]) {
  const groups: { [key: string]: ActivityItem[] } = {}
  
  activities.forEach(activity => {
    const date = new Date(activity.timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let key: string
    if (date.toDateString() === today.toDateString()) {
      key = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday'
    } else {
      key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    
    if (!groups[key]) groups[key] = []
    groups[key].push(activity)
  })
  
  return groups
}

export default function ActivityTimeline() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activity?limit=50')
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupedActivities = groupByDate(activities)

  if (loading) {
    return (
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 h-full">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-2xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Activity</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-white/30 font-medium">Live</span>
          </div>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
          <Activity className="h-8 w-8 text-white/10 mb-3" />
          <p className="text-white/30 text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedActivities).map(([date, items]) => (
            <div key={date}>
              {/* Date header */}
              <div className="sticky top-0 z-10 px-5 py-2 bg-[#111113]/95 backdrop-blur-sm border-b border-white/[0.03]">
                <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
                  {date}
                </span>
              </div>

              {/* Items */}
              <div className="px-5">
                {items.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className={`flex gap-3 py-3 ${index !== items.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-6 h-6 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center text-white shrink-0 mt-0.5`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] text-white/80 leading-snug">
                          {activity.title}
                        </p>
                        <span className="text-[11px] text-white/20 shrink-0">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      
                      {activity.description && (
                        <div className="mt-1 flex items-start gap-1">
                          <button
                            onClick={() => toggleExpanded(activity.id)}
                            className="text-white/40 hover:text-white/60 transition-colors shrink-0 mt-0.5"
                          >
                            {expandedItems.has(activity.id) ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                          <p 
                            className={`text-[11px] text-white/30 cursor-pointer ${expandedItems.has(activity.id) ? '' : 'line-clamp-1'}`}
                            onClick={() => toggleExpanded(activity.id)}
                          >
                            {activity.description}
                          </p>
                        </div>
                      )}
                      
                      <span className={`inline-block text-[10px] mt-1.5 ${
                        activity.actor === 'jess' 
                          ? 'text-[#4169E1]/70' 
                          : 'text-white/20'
                      }`}>
                        {activity.actor === 'jess' ? 'Jess' : activity.actor === 'armaan' ? 'You' : 'System'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
