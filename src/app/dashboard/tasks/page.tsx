'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, User, Bot, RefreshCw } from 'lucide-react'
import TaskDialog from '@/components/tasks/TaskDialog'

interface Task {
  id: string
  title: string
  description?: string
  status: 'backlog' | 'todo' | 'in-progress' | 'done'
  assignee: 'armaan' | 'jess'
  tags: string[]
  dueDate?: string
  createdAt: string
  updatedAt: string
}

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'bg-zinc-500', gradient: 'from-zinc-500/20 to-transparent' },
  { id: 'todo', label: 'To Do', color: 'bg-amber-500', gradient: 'from-amber-500/20 to-transparent' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-[#4169E1]', gradient: 'from-[#4169E1]/20 to-transparent' },
  { id: 'done', label: 'Done', color: 'bg-[#228B22]', gradient: 'from-[#228B22]/20 to-transparent' },
] as const

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [syncing, setSyncing] = useState(false)

  const syncJournalTodos = async () => {
    setSyncing(true)
    try {
      await fetch('/api/tasks/sync-journal')
      await fetchTasks()
    } catch (error) {
      console.error('Failed to sync:', error)
    } finally {
      setSyncing(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-sync journal todos on load, then fetch tasks
    const init = async () => {
      try {
        await fetch('/api/tasks/sync-journal')
      } catch (e) {
        console.error('Sync failed:', e)
      }
      fetchTasks()
    }
    init()
  }, [])

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault()
    if (!draggedTask || draggedTask.status === newStatus) return

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === draggedTask.id ? { ...t, status: newStatus } : t
    ))

    try {
      await fetch(`/api/tasks/${draggedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
    } catch (error) {
      console.error('Failed to update task:', error)
      fetchTasks() // Revert on error
    }

    setDraggedTask(null)
  }

  const handleTaskSaved = () => {
    setDialogOpen(false)
    setEditingTask(null)
    fetchTasks()
  }

  const openNewTask = () => {
    setEditingTask(null)
    setDialogOpen(true)
  }

  const openEditTask = (task: Task) => {
    setEditingTask(task)
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Drag and drop to update status</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={syncJournalTodos}
            disabled={syncing}
            className="border-white/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Journal'}
          </Button>
          <Button 
            onClick={openNewTask}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter(t => t.status === column.id)
          
          return (
            <div
              key={column.id}
              className="space-y-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${column.color} shadow-lg`} style={{ boxShadow: `0 0 8px ${column.color === 'bg-[#4169E1]' ? '#4169E1' : column.color === 'bg-[#228B22]' ? '#228B22' : 'currentColor'}40` }} />
                <h3 className="font-semibold text-sm tracking-wide">{column.label}</h3>
                <span className="text-muted-foreground text-xs bg-muted/50 px-1.5 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Drop Zone */}
              <div className={`space-y-2.5 min-h-[250px] p-2.5 rounded-xl bg-gradient-to-b ${column.gradient} border border-white/5 transition-colors`}>
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => openEditTask(task)}
                    className="group relative bg-[#111113] hover:bg-[#151517] border border-white/5 hover:border-white/10 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                  >
                    {/* Task Content */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium line-clamp-2 text-white/90">{task.title}</h4>
                      <div className={`p-1 rounded-md ${task.assignee === 'armaan' ? 'bg-[#4169E1]/10' : 'bg-[#228B22]/10'}`}>
                        {task.assignee === 'armaan' ? (
                          <User className="h-3.5 w-3.5 text-[#4169E1]" />
                        ) : (
                          <Bot className="h-3.5 w-3.5 text-[#228B22]" />
                        )}
                      </div>
                    </div>
                    
                    {task.dueDate && (
                      <p className="text-[11px] text-white/40 mb-2 font-medium">
                        Due {task.dueDate}
                      </p>
                    )}
                    
                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/50 font-medium">
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/40">
                            +{task.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Subtle left accent */}
                    <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${column.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                ))}
                
                {/* Empty state */}
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-white/20 border border-dashed border-white/10 rounded-lg">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSaved={handleTaskSaved}
      />
    </div>
  )
}
