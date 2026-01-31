'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  CheckSquare,
  BookOpen,
  Search,
  Plus,
  LayoutDashboard,
  ArrowRight,
  Calendar,
  Hash,
  Loader2
} from 'lucide-react'

// Get today's date in EST/EDT (client-side)
function getTodayEST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })
}

interface Task {
  id: string
  title: string
  description?: string
  status: string
  assignee: string
  tags: string[]
  dueDate?: string
}

interface Document {
  slug: string
  title: string
  tags: string[]
  updatedAt: string
}

interface JournalEntry {
  date: string
  summary?: string
  topics?: string[]
}

type ResultItem = 
  | { type: 'document'; data: Document }
  | { type: 'task'; data: Task }
  | { type: 'journal'; data: JournalEntry }
  | { type: 'action'; id: string; label: string; icon: React.ReactNode; action: () => void }

export default function CommandSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Build results list
  const results: ResultItem[] = []
  
  if (query.trim()) {
    // Add search results when there's a query
    documents.forEach(doc => results.push({ type: 'document', data: doc }))
    tasks.forEach(task => results.push({ type: 'task', data: task }))
    journals.forEach(entry => results.push({ type: 'journal', data: entry }))
  } else {
    // Show quick actions when empty
    results.push(
      { type: 'action', id: 'dashboard', label: 'Go to Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, action: () => router.push('/dashboard') },
      { type: 'action', id: 'documents', label: 'Go to Documents', icon: <FileText className="h-4 w-4" />, action: () => router.push('/dashboard/documents') },
      { type: 'action', id: 'tasks', label: 'Go to Tasks', icon: <CheckSquare className="h-4 w-4" />, action: () => router.push('/dashboard/tasks') },
      { type: 'action', id: 'journal', label: 'Go to Journal', icon: <BookOpen className="h-4 w-4" />, action: () => router.push('/dashboard/journal') },
      { type: 'action', id: 'new-doc', label: 'Create New Document', icon: <Plus className="h-4 w-4" />, action: () => router.push('/dashboard/documents/new') },
      { type: 'action', id: 'new-task', label: 'Create New Task', icon: <Plus className="h-4 w-4" />, action: () => router.push('/dashboard/tasks?new=true') },
      { type: 'action', id: 'today-journal', label: "Today's Journal", icon: <Calendar className="h-4 w-4" />, action: () => router.push(`/dashboard/journal/${getTodayEST()}`) },
    )
  }

  // Group results by type
  const groupedResults = {
    actions: results.filter(r => r.type === 'action') as Extract<ResultItem, { type: 'action' }>[],
    documents: results.filter(r => r.type === 'document') as Extract<ResultItem, { type: 'document' }>[],
    tasks: results.filter(r => r.type === 'task') as Extract<ResultItem, { type: 'task' }>[],
    journals: results.filter(r => r.type === 'journal') as Extract<ResultItem, { type: 'journal' }>[],
  }

  // Search function
  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setTasks([])
      setDocuments([])
      setJournals([])
      return
    }

    setLoading(true)
    try {
      const [tasksRes, docsRes, journalsRes] = await Promise.all([
        fetch(`/api/tasks?search=${encodeURIComponent(q)}`),
        fetch(`/api/documents?search=${encodeURIComponent(q)}`),
        fetch(`/api/journal?search=${encodeURIComponent(q)}`)
      ])

      if (tasksRes.ok) setTasks(await tasksRes.json())
      if (docsRes.ok) setDocuments(await docsRes.json())
      if (journalsRes.ok) setJournals(await journalsRes.json())
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(() => {
      search(query)
    }, 200)
    return () => clearTimeout(debounce)
  }, [query, search])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, documents.length, tasks.length, journals.length])

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // ⌘+K - Toggle search
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
      // ⌘+/ - Also open search (for backward compat)
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
      // ⌘+N - New document
      if (e.key === 'n' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault()
        router.push('/dashboard/documents/new')
      }
      // ⌘+J - Today's journal
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        const today = getTodayEST()
        router.push(`/dashboard/journal/${today}`)
      }
      // ⌘+1-4 - Navigation
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault()
        const routes = ['/dashboard', '/dashboard/documents', '/dashboard/tasks', '/dashboard/journal']
        router.push(routes[parseInt(e.key) - 1])
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [router])

  // Modal keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = results[selectedIndex]
        if (item) selectItem(item)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, results])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const selectItem = (item: ResultItem) => {
    setOpen(false)
    if (item.type === 'action') {
      item.action()
    } else if (item.type === 'document') {
      router.push(`/dashboard/documents/${item.data.slug}`)
    } else if (item.type === 'task') {
      router.push(`/dashboard/tasks?highlight=${item.data.id}`)
    } else if (item.type === 'journal') {
      router.push(`/dashboard/journal/${item.data.date}`)
    }
  }

  const getItemIndex = (groupKey: string, itemIndex: number): number => {
    let offset = 0
    const order = ['actions', 'documents', 'tasks', 'journals'] as const
    for (const key of order) {
      if (key === groupKey) break
      offset += groupedResults[key].length
    }
    return offset + itemIndex
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      
      {/* Modal */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl">
        <div className="bg-[#0a0a0b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-white/5">
            <Search className="h-5 w-5 text-white/40 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or type a command..."
              className="flex-1 bg-transparent py-4 text-base text-white placeholder:text-white/40 focus:outline-none command-search-input"
              autoComplete="off"
              spellCheck={false}
            />
            {loading && <Loader2 className="h-4 w-4 text-white/40 animate-spin" />}
            <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/40 font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto py-2">
            {query.trim() && results.length === 0 && !loading && (
              <div className="px-4 py-8 text-center text-white/40">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>No results found for &quot;{query}&quot;</p>
              </div>
            )}

            {/* Quick Actions (when no query) */}
            {groupedResults.actions.length > 0 && (
              <ResultGroup title="Quick Actions">
                {groupedResults.actions.map((item, i) => (
                  <ResultRow
                    key={item.id}
                    selected={selectedIndex === getItemIndex('actions', i)}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setSelectedIndex(getItemIndex('actions', i))}
                  >
                    <span className="text-white/50">{item.icon}</span>
                    <span className="text-white/90">{item.label}</span>
                  </ResultRow>
                ))}
              </ResultGroup>
            )}

            {/* Documents */}
            {groupedResults.documents.length > 0 && (
              <ResultGroup title="Documents">
                {groupedResults.documents.map((item, i) => (
                  <ResultRow
                    key={item.data.slug}
                    selected={selectedIndex === getItemIndex('documents', i)}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setSelectedIndex(getItemIndex('documents', i))}
                  >
                    <FileText className="h-4 w-4 text-blue-400/70" />
                    <div className="flex-1 min-w-0">
                      <span className="text-white/90">{item.data.title}</span>
                      {item.data.tags.length > 0 && (
                        <span className="ml-2 text-white/30 text-sm">
                          {item.data.tags.slice(0, 2).map(t => `#${t}`).join(' ')}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </ResultRow>
                ))}
              </ResultGroup>
            )}

            {/* Tasks */}
            {groupedResults.tasks.length > 0 && (
              <ResultGroup title="Tasks">
                {groupedResults.tasks.map((item, i) => (
                  <ResultRow
                    key={item.data.id}
                    selected={selectedIndex === getItemIndex('tasks', i)}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setSelectedIndex(getItemIndex('tasks', i))}
                  >
                    <CheckSquare className="h-4 w-4 text-green-400/70" />
                    <div className="flex-1 min-w-0">
                      <span className="text-white/90">{item.data.title}</span>
                      <span className="ml-2 text-white/30 text-sm capitalize">{item.data.status}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </ResultRow>
                ))}
              </ResultGroup>
            )}

            {/* Journal */}
            {groupedResults.journals.length > 0 && (
              <ResultGroup title="Journal Entries">
                {groupedResults.journals.map((item, i) => (
                  <ResultRow
                    key={item.data.date}
                    selected={selectedIndex === getItemIndex('journals', i)}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setSelectedIndex(getItemIndex('journals', i))}
                  >
                    <BookOpen className="h-4 w-4 text-purple-400/70" />
                    <div className="flex-1 min-w-0">
                      <span className="text-white/90">{item.data.date}</span>
                      {item.data.summary && (
                        <span className="ml-2 text-white/30 text-sm truncate">{item.data.summary}</span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </ResultRow>
                ))}
              </ResultGroup>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between text-xs text-white/30">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↵</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="px-4 py-1.5 text-xs font-medium text-white/30 uppercase tracking-wider">
        {title}
      </div>
      {children}
    </div>
  )
}

function ResultRow({ 
  children, 
  selected, 
  onClick, 
  onMouseEnter 
}: { 
  children: React.ReactNode
  selected: boolean
  onClick: () => void
  onMouseEnter: () => void
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        group w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
        ${selected ? 'bg-[#4169E1]/15' : 'hover:bg-white/5'}
      `}
    >
      {children}
    </button>
  )
}

// Export function to open search programmatically
export function useCommandSearch() {
  const open = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true
    })
    document.dispatchEvent(event)
  }
  return { open }
}
