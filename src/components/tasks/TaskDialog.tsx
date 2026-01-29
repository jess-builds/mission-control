'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Trash2 } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  status: 'backlog' | 'todo' | 'in-progress' | 'done'
  assignee: 'armaan' | 'jess'
  tags: string[]
  dueDate?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onSaved: () => void
}

const AVAILABLE_TAGS = ['SCAD', 'Clover', 'Debtless', 'Life Lab', 'Content', 'Personal', 'Mission Control']
const STATUSES = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
] as const

export default function TaskDialog({ open, onOpenChange, task, onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Task['status']>('backlog')
  const [assignee, setAssignee] = useState<Task['assignee']>('armaan')
  const [tags, setTags] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setAssignee(task.assignee)
      setTags(task.tags)
      setDueDate(task.dueDate || '')
    } else {
      setTitle('')
      setDescription('')
      setStatus('backlog')
      setAssignee('armaan')
      setTags([])
      setDueDate('')
    }
  }, [task, open])

  const toggleTag = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSave = async () => {
    if (!title.trim()) return
    
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
        })
      })
      
      onSaved()
    } catch (error) {
      console.error('Failed to save task:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    
    setDeleting(true)
    try {
      await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      onSaved()
    } catch (error) {
      console.error('Failed to delete task:', error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="w-full h-24 p-3 bg-background border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full p-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value as Task['assignee'])}
                className="w-full p-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="armaan">Armaan</option>
                <option value="jess">Jess</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={tags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {tags.includes(tag) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {task && (
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
