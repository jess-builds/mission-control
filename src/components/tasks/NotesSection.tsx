'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2, MessageSquare } from 'lucide-react'

interface Note {
  id: string
  author: string
  content: string
  timestamp: string
}

interface NotesSectionProps {
  taskId: string
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffHours / 24
  
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`
  }
  
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`
  }
  
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function NoteItem({ note }: { note: Note }) {
  const isJess = note.author.toLowerCase() === 'jess'
  
  return (
    <div className="group">
      <div
        className={`
          rounded-lg px-3 py-2 max-w-[90%]
          ${isJess 
            ? 'bg-blue-500/10 border border-blue-500/20' 
            : 'bg-white/5 border border-white/10'
          }
        `}
      >
        <div className="flex items-center gap-2 mb-1">
          <span 
            className={`
              text-xs font-medium
              ${isJess ? 'text-blue-400' : 'text-white/70'}
            `}
          >
            {note.author.charAt(0).toUpperCase() + note.author.slice(1)}
          </span>
          <span className="text-[10px] text-white/40">
            {formatTimestamp(note.timestamp)}
          </span>
        </div>
        <p className="text-sm text-white/90 whitespace-pre-wrap break-words">
          {note.content}
        </p>
      </div>
    </div>
  )
}

export default function NotesSection({ taskId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const notesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const fetchNotes = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`/api/tasks/${taskId}/notes`)
      if (!res.ok) throw new Error('Failed to fetch notes')
      const data = await res.json()
      setNotes(data.notes || [])
    } catch (err) {
      console.error('Error fetching notes:', err)
      setError('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  useEffect(() => {
    if (!loading && notes.length > 0) {
      scrollToBottom()
    }
  }, [notes, loading, scrollToBottom])

  const handleSubmit = async () => {
    if (!newNote.trim() || submitting) return
    
    setSubmitting(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() })
      })
      
      if (!res.ok) throw new Error('Failed to add note')
      
      const data = await res.json()
      setNotes(prev => [...prev, data.note])
      setNewNote('')
      
      // Focus back on textarea
      textareaRef.current?.focus()
    } catch (err) {
      console.error('Error adding note:', err)
      setError('Failed to send note')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-white/40">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading notes...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Notes header */}
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-white/50" />
        <h3 className="text-sm font-medium text-white/70">Notes</h3>
        {notes.length > 0 && (
          <span className="text-xs text-white/40">({notes.length})</span>
        )}
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 min-h-0 max-h-[300px]">
        {error && (
          <div className="text-red-400 text-sm text-center py-2">{error}</div>
        )}
        
        {notes.length === 0 && !error ? (
          <div className="text-white/30 text-sm text-center py-6">
            No notes yet. Leave a note to communicate about this task.
          </div>
        ) : (
          notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))
        )}
        <div ref={notesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 pt-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Leave a note..."
            rows={2}
            className="
              w-full resize-none rounded-lg
              bg-white/5 border border-white/10
              px-3 py-2 pr-12
              text-sm text-white placeholder-white/30
              focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30
              transition-colors
            "
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newNote.trim() || submitting}
            className="
              absolute right-2 bottom-2
              h-7 w-7 p-0
              bg-blue-600 hover:bg-blue-700
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-white/30 mt-1 text-right">
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to send
        </p>
      </div>
    </div>
  )
}
