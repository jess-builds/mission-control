'use client'

import { useState, useEffect } from 'react'
import { X, Send, CheckSquare, Clock, MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Task {
  id: string
  title: string
  status: string
  description?: string
  dueDate?: string
}

interface Note {
  id: string
  message: string
  timestamp: string
  type: string
  status: string
}

interface ProjectModalProps {
  project: {
    id: string
    name: string
    description: string
    color: string
    icon: React.ComponentType<{ className?: string }>
  }
  onClose: () => void
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchProjectData()
  }, [project.id])

  const fetchProjectData = async () => {
    try {
      const res = await fetch(`/api/projects?id=${project.id}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Failed to fetch project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendToJess = async () => {
    if (!message.trim()) return
    
    setSending(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          message: message.trim(),
          type: 'delegation'
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setNotes([data.note, ...notes])
        setMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-500'
      case 'in-progress': return 'bg-blue-500'
      case 'todo': return 'bg-amber-500'
      default: return 'bg-slate-500'
    }
  }

  const formatTime = (timestamp: string) => {
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

  const Icon = project.icon

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 bg-gradient-to-r ${project.color} relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{project.name}</h2>
              <p className="text-white/80 text-sm">{project.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
          ) : (
            <>
              {/* Tasks Section */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks ({tasks.length})
                </h3>
                {tasks.length === 0 ? (
                  <p className="text-white/40 text-sm">No tasks for this project yet.</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${task.status === 'done' ? 'text-white/40 line-through' : 'text-white'}`}>
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60 capitalize">
                          {task.status.replace('-', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delegation Notes Section */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Notes to Jess
                </h3>
                {notes.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {notes.slice(0, 5).map(note => (
                      <div key={note.id} className="p-3 rounded-lg bg-[#4169E1]/10 border border-[#4169E1]/20">
                        <p className="text-sm text-white">{note.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-white/40">{formatTime(note.timestamp)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            note.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                            note.status === 'acknowledged' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-amber-500/20 text-amber-500'
                          }`}>
                            {note.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendToJess()}
                    placeholder="Hey Jess, can you..."
                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1]/50"
                  />
                  <Button
                    onClick={sendToJess}
                    disabled={!message.trim() || sending}
                    className="bg-[#4169E1] hover:bg-[#4169E1]/80"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-white/30 mt-2">
                  Send a note to Jess for delegation. She'll see it and take action.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
