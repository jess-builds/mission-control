'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Calendar, Save, X, Edit3, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import dynamic from 'next/dynamic'

const WysiwygEditor = dynamic(() => import('@/components/documents/WysiwygEditor'), {
  ssr: false,
  loading: () => <div className="p-6 text-white/40">Loading editor...</div>
})

interface JournalMeta {
  date: string
  summary: string
  topics: string[]
}

interface JournalEntry extends JournalMeta {
  content: string
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalMeta[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  // Fetch entries list
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await fetch('/api/journal')
        if (res.ok) {
          const data = await res.json()
          setEntries(data)
          if (data.length > 0 && !selectedDate) {
            setSelectedDate(data[0].date)
          }
        }
      } catch (error) {
        console.error('Failed to fetch entries:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEntries()
  }, [])

  // Fetch selected entry
  useEffect(() => {
    if (!selectedDate) {
      setSelectedEntry(null)
      return
    }

    const fetchEntry = async () => {
      try {
        const res = await fetch(`/api/journal/${selectedDate}`)
        if (res.ok) {
          const data = await res.json()
          setSelectedEntry(data)
          setEditContent(data.content)
        }
      } catch (error) {
        console.error('Failed to fetch entry:', error)
      }
    }
    fetchEntry()
  }, [selectedDate])

  const handleSave = async () => {
    if (!selectedEntry) return

    setSaving(true)
    try {
      const res = await fetch(`/api/journal/${selectedEntry.date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent
        })
      })

      if (res.ok) {
        setSelectedEntry({ ...selectedEntry, content: editContent })
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditContent(selectedEntry?.content || '')
    setIsEditing(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Left Panel - Entry List */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#4169E1]" />
            Journal
          </h2>
          <p className="text-sm text-white/40 mt-1">Daily notes & logs</p>
        </div>

        {/* Entry List */}
        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <div className="p-4 text-white/40 text-center">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="p-4 text-white/40 text-center text-sm">
              No journal entries yet
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map(entry => (
                <button
                  key={entry.date}
                  onClick={() => {
                    setSelectedDate(entry.date)
                    setIsEditing(false)
                  }}
                  className={`
                    w-full text-left px-3 py-3 rounded-lg transition-all
                    ${selectedDate === entry.date
                      ? 'bg-[#4169E1]/10 border border-[#4169E1]/30'
                      : 'hover:bg-white/5 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium
                      ${selectedDate === entry.date 
                        ? 'bg-[#4169E1]/20 text-[#4169E1]' 
                        : 'bg-white/5 text-white/60'
                      }
                    `}>
                      {formatShortDate(entry.date).split(' ')[1]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white">{entry.date}</div>
                      <div className="text-xs text-white/40 truncate mt-0.5">
                        {entry.summary || 'No summary'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Entry View/Edit */}
      <div className="flex-1 flex flex-col bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
        {selectedEntry ? (
          <>
            {/* Entry Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-white mb-2">
                    {formatDate(selectedEntry.date)}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-white/40">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {selectedEntry.date}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#4169E1]/10 text-[#4169E1] text-xs">
                      Synced with Jess
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="border-white/10"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#228B22] hover:bg-[#228B22]/80"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="border-white/10 hover:border-[#4169E1]/50 hover:bg-[#4169E1]/10"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {selectedEntry.topics.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {selectedEntry.topics.map(topic => (
                    <span
                      key={topic}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/60 border border-white/10"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Entry Content */}
            <div className="flex-1 overflow-auto">
              {isEditing ? (
                <WysiwygEditor
                  content={editContent}
                  onChange={setEditContent}
                  placeholder="Write your journal entry..."
                />
              ) : (
                <div className="p-8 md:p-10">
                  <div className="prose prose-invert prose-lg max-w-none
                    prose-headings:font-semibold prose-headings:text-white prose-headings:mt-10 prose-headings:mb-4
                    prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-6
                    prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pt-6 prose-h2:border-t prose-h2:border-white/5
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                    prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2
                    prose-p:text-white/70 prose-p:leading-loose prose-p:mb-5
                    prose-a:text-[#4169E1] prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-white prose-strong:font-semibold
                    prose-em:text-white/80
                    prose-code:text-[#228B22] prose-code:bg-[#228B22]/10 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:font-mono prose-code:text-sm
                    prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-5 prose-pre:my-6
                    prose-ul:text-white/70 prose-ul:my-5 prose-ul:space-y-2
                    prose-ol:text-white/70 prose-ol:my-5 prose-ol:space-y-2
                    prose-li:marker:text-[#4169E1] prose-li:leading-relaxed prose-li:pl-2
                    prose-blockquote:border-l-4 prose-blockquote:border-l-[#4169E1] prose-blockquote:text-white/60 prose-blockquote:bg-white/[0.02] prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:my-6 prose-blockquote:italic
                    prose-hr:border-white/10 prose-hr:my-10
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedEntry.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/40">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a journal entry to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
