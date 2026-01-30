'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Trash2, 
  AlertTriangle,
  FileText,
  Upload,
  MessageSquare,
  CheckSquare,
  Send,
  User,
  Bot,
  Calendar,
  ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import ReferenceDocuments from './ReferenceDocuments'
import OutputDocuments from './OutputDocuments'
import DocumentViewer from './DocumentViewer'

interface Task {
  id: string
  title: string
  description?: string
  status: 'backlog' | 'todo' | 'in-progress' | 'done'
  assignee: 'armaan' | 'jess'
  tags: string[]
  dueDate?: string
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  blocked?: {
    reason: string
    blockedAt: string
    blockedBy: string
  } | null
  completionCriteria?: string
  notes?: Array<{
    id: string
    author: string
    content: string
    timestamp: string
  }>
  documents?: Array<{
    id: string
    title: string
    type: 'output' | 'handoff'
  }>
  referenceDocuments?: Array<{
    id: string
    title: string
  }>
  createdAt: string
  updatedAt: string
}

interface Props {
  open: boolean
  onClose: () => void
  task: Task | null
  onSaved: () => void
}

const AVAILABLE_TAGS = ['SCAD', 'Clover', 'Debtless', 'Life Lab', 'Content', 'Personal', 'Mission Control']
const STATUSES = [
  { id: 'backlog', label: 'Backlog', color: 'bg-zinc-500' },
  { id: 'todo', label: 'To Do', color: 'bg-amber-500' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-[#4169E1]' },
  { id: 'done', label: 'Done', color: 'bg-[#228B22]' },
] as const

const PRIORITIES = [
  { id: 'urgent', label: '🔴 Urgent', color: 'text-red-500' },
  { id: 'high', label: '🟠 High', color: 'text-orange-500' },
  { id: 'normal', label: 'Normal', color: 'text-white/60' },
  { id: 'low', label: '🔵 Low', color: 'text-blue-400' },
] as const

export default function TaskDrawer({ open, onClose, task, onSaved }: Props) {
  const drawerRef = useRef<HTMLDivElement>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Task['status']>('backlog')
  const [assignee, setAssignee] = useState<Task['assignee']>('armaan')
  const [tags, setTags] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'urgent' | 'high' | 'normal' | 'low'>('normal')
  const [completionCriteria, setCompletionCriteria] = useState('')
  const [blocked, setBlocked] = useState<Task['blocked']>(null)
  
  // UI state
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setAssignee(task.assignee)
      setTags(task.tags)
      setDueDate(task.dueDate || '')
      setPriority(task.priority || 'normal')
      setCompletionCriteria(task.completionCriteria || '')
      setBlocked(task.blocked || null)
    } else {
      setTitle('')
      setDescription('')
      setStatus('backlog')
      setAssignee('armaan')
      setTags([])
      setDueDate('')
      setPriority('normal')
      setCompletionCriteria('')
      setBlocked(null)
    }
  }, [task, open])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  const toggleTag = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a task title')
      return
    }
    
    setSaving(true)
    try {
      const url = task ? `/api/tasks/${task.id}` : '/api/tasks'
      const method = task ? 'PUT' : 'POST'
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          status,
          assignee,
          tags,
          dueDate: dueDate || undefined,
          priority,
          completionCriteria: completionCriteria || undefined,
          blocked,
        })
      })
      
      toast.success(task ? 'Task updated' : 'Task created', {
        description: title,
      })
      onSaved()
    } catch (error) {
      console.error('Failed to save task:', error)
      toast.error('Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    
    setDeleting(true)
    try {
      await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      toast.success('Task deleted')
      onSaved()
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task')
    } finally {
      setDeleting(false)
    }
  }

  const handleSendNote = async () => {
    if (!newNote.trim() || !task) return
    
    // TODO: Implement note sending via API
    toast.info('Note feature coming soon', {
      description: 'Notes will be sent to Jess for processing'
    })
    setNewNote('')
  }

  if (!open) return null

  return (
    <>
      {/* Overlay/Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 h-full w-full sm:w-[500px] lg:w-[40%] bg-[#0a0a0b] border-l border-white/10 z-50 overflow-hidden flex flex-col transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ boxShadow: '-10px 0 40px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/10 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="text-xl font-semibold bg-transparent border-white/20 focus:border-[#4169E1]"
                  autoFocus
                  placeholder="Task title..."
                />
              ) : (
                <h2 
                  className="text-xl font-semibold text-white cursor-text truncate hover:text-white/80 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {title || 'Untitled Task'}
                </h2>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">
            
            {/* Blocked Banner */}
            {blocked && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-amber-500 font-medium text-sm">Task Blocked</h4>
                    <p className="text-amber-500/80 text-sm mt-1">{blocked.reason}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                      onClick={() => setBlocked(null)}
                    >
                      Mark Unblocked
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Section */}
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/50 w-20">Status</span>
                <div className="relative flex-1">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Task['status'])}
                    className="w-full p-2 bg-[#111113] border border-white/10 rounded-md text-sm appearance-none cursor-pointer hover:border-white/20 focus:border-[#4169E1] focus:outline-none transition-colors"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/50 w-20">Priority</span>
                <div className="relative flex-1">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                    className="w-full p-2 bg-[#111113] border border-white/10 rounded-md text-sm appearance-none cursor-pointer hover:border-white/20 focus:border-[#4169E1] focus:outline-none transition-colors"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/50 w-20">Assignee</span>
                <div className="relative flex-1">
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value as Task['assignee'])}
                    className="w-full p-2 bg-[#111113] border border-white/10 rounded-md text-sm appearance-none cursor-pointer hover:border-white/20 focus:border-[#4169E1] focus:outline-none transition-colors"
                  >
                    <option value="armaan">👤 Armaan</option>
                    <option value="jess">🤖 Jess</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/50 w-20">Due</span>
                <div className="relative flex-1">
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-[#111113] border-white/10 hover:border-white/20 focus:border-[#4169E1]"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-start gap-3">
                <span className="text-sm text-white/50 w-20 pt-2">Tags</span>
                <div className="flex-1 flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={tags.includes(tag) ? 'default' : 'outline'}
                      className={`cursor-pointer text-xs ${
                        tags.includes(tag) 
                          ? 'bg-[#4169E1]/20 text-[#4169E1] border-[#4169E1]/30 hover:bg-[#4169E1]/30' 
                          : 'border-white/20 text-white/60 hover:border-white/40'
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      {tags.includes(tag) && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3 text-white/80">
                <FileText className="h-4 w-4" />
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                className="w-full h-24 p-3 bg-[#111113] border border-white/10 rounded-lg text-sm resize-none focus:outline-none focus:border-[#4169E1] transition-colors placeholder:text-white/30"
              />
            </div>

            {/* Completion Criteria */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3 text-white/80">
                <CheckSquare className="h-4 w-4" />
                Completion Criteria
              </label>
              <textarea
                value={completionCriteria}
                onChange={(e) => setCompletionCriteria(e.target.value)}
                placeholder="How will we know this is done?"
                className="w-full h-20 p-3 bg-[#111113] border border-white/10 rounded-lg text-sm resize-none focus:outline-none focus:border-[#4169E1] transition-colors placeholder:text-white/30"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Reference Documents */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3 text-white/80">
                <FileText className="h-4 w-4" />
                Reference Documents
              </label>
              <DocumentsList 
                documents={task?.referenceDocuments || []} 
                type="reference"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-white/20 text-white/60 hover:text-white hover:border-white/40"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Reference Doc
              </Button>
            </div>

            {/* Output Documents */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3 text-white/80">
                <FileText className="h-4 w-4" />
                Output Documents
              </label>
              <DocumentsList 
                documents={task?.documents?.filter(d => d.type === 'output') || []} 
                type="output"
              />
            </div>

            {/* Handoff Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3 text-white/80">
                <FileText className="h-4 w-4" />
                Handoff Notes
              </label>
              <DocumentsList 
                documents={task?.documents?.filter(d => d.type === 'handoff') || []} 
                type="handoff"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Notes/Comments */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3 text-white/80">
                <MessageSquare className="h-4 w-4" />
                Notes
              </label>
              <NotesSection notes={task?.notes || []} />
              
              {/* Note Input */}
              <div className="mt-4 flex gap-2">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Leave a note for Jess..."
                  className="flex-1 bg-[#111113] border-white/10 focus:border-[#4169E1]"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendNote()}
                />
                <Button
                  onClick={handleSendNote}
                  disabled={!newNote.trim()}
                  className="bg-[#4169E1] hover:bg-[#4169E1]/80"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 border-t border-white/10 px-6 py-4 bg-[#0a0a0b]">
          <div className="flex items-center justify-between">
            {task && (
              <Button 
                variant="ghost" 
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="border-white/20"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!title.trim() || saving}
                className="bg-[#4169E1] hover:bg-[#4169E1]/80"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Placeholder component for documents list
function DocumentsList({ 
  documents, 
  type 
}: { 
  documents: Array<{ id: string; title: string }>
  type: 'reference' | 'output' | 'handoff' 
}) {
  if (documents.length === 0) {
    return (
      <div className="text-sm text-white/40 py-3 px-4 bg-[#111113] rounded-lg border border-white/5">
        No {type === 'reference' ? 'reference' : type === 'output' ? 'output' : 'handoff'} documents yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div 
          key={doc.id}
          className="flex items-center gap-3 p-3 bg-[#111113] rounded-lg border border-white/5 hover:border-white/10 cursor-pointer transition-colors"
        >
          <FileText className="h-4 w-4 text-white/40" />
          <span className="text-sm text-white/80">{doc.title}</span>
        </div>
      ))}
    </div>
  )
}

// Placeholder component for notes section
function NotesSection({ notes }: { notes: Task['notes'] }) {
  if (!notes || notes.length === 0) {
    return (
      <div className="text-sm text-white/40 py-3 px-4 bg-[#111113] rounded-lg border border-white/5">
        No notes yet
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {notes.map((note) => (
        <div 
          key={note.id}
          className="p-3 bg-[#111113] rounded-lg border border-white/5"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1 rounded-md ${note.author === 'armaan' ? 'bg-[#4169E1]/10' : 'bg-[#228B22]/10'}`}>
              {note.author === 'armaan' ? (
                <User className="h-3 w-3 text-[#4169E1]" />
              ) : (
                <Bot className="h-3 w-3 text-[#228B22]" />
              )}
            </div>
            <span className="text-xs font-medium text-white/60 capitalize">{note.author}</span>
            <span className="text-xs text-white/40">
              {new Date(note.timestamp).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-white/80">{note.content}</p>
        </div>
      ))}
    </div>
  )
}
