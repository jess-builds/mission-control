'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, CheckSquare, BookOpen, Search as SearchIcon } from 'lucide-react'

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

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [tasks, setTasks] = useState<Task[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

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

  useEffect(() => {
    const debounce = setTimeout(() => {
      search(query)
    }, 300)
    return () => clearTimeout(debounce)
  }, [query, search])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const totalResults = tasks.length + documents.length + journals.length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground text-sm">
          Search across documents, tasks, and journal entries. Press ⌘/ to focus.
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything..."
          className="pl-10 h-12 text-lg"
          autoFocus
        />
      </div>

      {query && (
        <div className="text-sm text-muted-foreground">
          {loading ? 'Searching...' : `${totalResults} results for "${query}"`}
        </div>
      )}

      {query && !loading && totalResults > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({totalResults})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-1" />
              Docs ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckSquare className="h-4 w-4 mr-1" />
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="journal">
              <BookOpen className="h-4 w-4 mr-1" />
              Journal ({journals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {documents.map((doc) => (
              <SearchResult
                key={doc.slug}
                type="document"
                title={doc.title}
                subtitle={doc.tags.join(', ')}
                onClick={() => router.push(`/dashboard/documents/${doc.slug}`)}
              />
            ))}
            {tasks.map((task) => (
              <SearchResult
                key={task.id}
                type="task"
                title={task.title}
                subtitle={`${task.status} • ${task.assignee}`}
                tags={task.tags}
                onClick={() => router.push(`/dashboard/tasks?highlight=${task.id}`)}
              />
            ))}
            {journals.map((entry) => (
              <SearchResult
                key={entry.date}
                type="journal"
                title={entry.date}
                subtitle={entry.summary}
                onClick={() => router.push(`/dashboard/journal/${entry.date}`)}
              />
            ))}
          </TabsContent>

          <TabsContent value="documents" className="space-y-3 mt-4">
            {documents.map((doc) => (
              <SearchResult
                key={doc.slug}
                type="document"
                title={doc.title}
                subtitle={doc.tags.join(', ')}
                onClick={() => router.push(`/dashboard/documents/${doc.slug}`)}
              />
            ))}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-3 mt-4">
            {tasks.map((task) => (
              <SearchResult
                key={task.id}
                type="task"
                title={task.title}
                subtitle={`${task.status} • ${task.assignee}`}
                tags={task.tags}
                onClick={() => router.push(`/dashboard/tasks?highlight=${task.id}`)}
              />
            ))}
          </TabsContent>

          <TabsContent value="journal" className="space-y-3 mt-4">
            {journals.map((entry) => (
              <SearchResult
                key={entry.date}
                type="journal"
                title={entry.date}
                subtitle={entry.summary}
                onClick={() => router.push(`/dashboard/journal/${entry.date}`)}
              />
            ))}
          </TabsContent>
        </Tabs>
      )}

      {query && !loading && totalResults === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No results found for "{query}"</p>
          <p className="text-sm mt-2">Try different keywords or check your spelling</p>
        </div>
      )}
    </div>
  )
}

function SearchResult({
  type,
  title,
  subtitle,
  tags,
  onClick
}: {
  type: 'document' | 'task' | 'journal'
  title: string
  subtitle?: string
  tags?: string[]
  onClick: () => void
}) {
  const icons = {
    document: FileText,
    task: CheckSquare,
    journal: BookOpen
  }
  const Icon = icons[type]

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors border-border"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-medium">{title}</div>
          {subtitle && (
            <div className="text-sm text-muted-foreground truncate">{subtitle}</div>
          )}
          {tags && tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
