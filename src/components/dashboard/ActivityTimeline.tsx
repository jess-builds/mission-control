'use client'

import { FileText, CheckSquare, BookOpen, Clock, Plus, Edit, Check } from 'lucide-react'

interface Activity {
  id: string
  type: 'task_created' | 'task_completed' | 'task_updated' | 'document_created' | 'document_updated' | 'journal_created'
  title: string
  description?: string
  timestamp: string
  actor: 'armaan' | 'jess'
}

// This would normally come from an API, but for now we'll generate from existing data
function getRecentActivities(): Activity[] {
  const now = new Date()
  const activities: Activity[] = [
    {
      id: '1',
      type: 'task_created',
      title: 'Mission Control MVP',
      description: 'Added to In Progress',
      timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      actor: 'jess'
    },
    {
      id: '2',
      type: 'document_created',
      title: 'Welcome to Mission Control',
      timestamp: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
      actor: 'jess'
    },
    {
      id: '3',
      type: 'journal_created',
      title: 'Today\'s Entry',
      description: 'First night building Mission Control',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      actor: 'jess'
    },
    {
      id: '4',
      type: 'task_completed',
      title: 'Review Mission Control spec',
      timestamp: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
      actor: 'armaan'
    }
  ]
  return activities
}

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'task_created':
      return <Plus className="h-3 w-3" />
    case 'task_completed':
      return <Check className="h-3 w-3" />
    case 'task_updated':
      return <Edit className="h-3 w-3" />
    case 'document_created':
    case 'document_updated':
      return <FileText className="h-3 w-3" />
    case 'journal_created':
      return <BookOpen className="h-3 w-3" />
  }
}

function getActivityColor(type: Activity['type']) {
  switch (type) {
    case 'task_completed':
      return 'bg-emerald-500'
    case 'task_created':
    case 'task_updated':
      return 'bg-blue-500'
    case 'document_created':
    case 'document_updated':
      return 'bg-purple-500'
    case 'journal_created':
      return 'bg-amber-500'
  }
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

export default function ActivityTimeline() {
  const activities = getRecentActivities()

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3">
          {/* Icon */}
          <div className="relative flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center text-white`}>
              {getActivityIcon(activity.type)}
            </div>
            {index < activities.length - 1 && (
              <div className="w-px h-full bg-border absolute top-6" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{activity.title}</p>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>
            {activity.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              by {activity.actor}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
