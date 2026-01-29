'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, User, Bot } from 'lucide-react'
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
  { id: 'backlog', label: 'Backlog', color: 'bg-slate-500' },
  { id: 'todo', label: 'To Do', color: 'bg-yellow-500' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'done', label: 'Done', color: 'bg-emerald-500' },
] as const

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

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
    fetchTasks()
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
        <Button 
          onClick={openNewTask}
          className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter(t => t.status === column.id)
          
          return (
            <div
              key={column.id}
              className="space-y-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="font-medium">{column.label}</h3>
                <span className="text-muted-foreground text-sm">({columnTasks.length})</span>
              </div>

              <div className="space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/30 border border-dashed border-border">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => openEditTask(task)}
                    className="bg-card border-border cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-colors"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
                        {task.assignee === 'armaan' ? (
                          <User className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : (
                          <Bot className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Due: {task.dueDate}
                        </p>
                      )}
                      
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              +{task.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
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
