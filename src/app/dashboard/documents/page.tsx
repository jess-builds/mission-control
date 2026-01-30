'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Brain, Save, X, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import dynamic from 'next/dynamic'
import type { Editor } from '@tiptap/react'

// Dynamically import editor to avoid SSR issues
const WysiwygEditor = dynamic(() => import('@/components/documents/WysiwygEditor'), {
  ssr: false,
  loading: () => <div className="p-6 text-white/40">Loading editor...</div>
})

// Dynamically import toolbar
const EditorToolbar = dynamic(
  () => import('@/components/documents/WysiwygEditor').then(mod => mod.EditorToolbar),
  { ssr: false }
)

interface DocumentMeta {
  slug: string
  title: string
  tags: string[]
  createdAt: string
  updatedAt: string
  source?: string
}

interface Document extends DocumentMeta {
  content: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)

  // Fetch documents list
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch('/api/documents')
        if (res.ok) {
          const data = await res.json()
          setDocuments(data)
          // Auto-select first document
          if (data.length > 0 && !selectedSlug) {
            setSelectedSlug(data[0].slug)
          }
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [])

  // Fetch selected document
  useEffect(() => {
    if (!selectedSlug) {
      setSelectedDoc(null)
      return
    }

    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/documents/${selectedSlug}`)
        if (res.ok) {
          const data = await res.json()
          setSelectedDoc(data)
          setEditContent(data.content)
        }
      } catch (error) {
        console.error('Failed to fetch document:', error)
      }
    }
    fetchDocument()
  }, [selectedSlug])

  // Filter documents based on search
  const filteredDocs = documents.filter(doc => {
    const query = searchQuery.toLowerCase()
    return doc.title.toLowerCase().includes(query) ||
           doc.tags.some(tag => tag.toLowerCase().includes(query))
  })

  // Group documents by source (memory docs now in Journal)
  const workspaceDocs = filteredDocs.filter(d => d.source === 'workspace')
  const regularDocs = filteredDocs.filter(d => d.source === 'documents' || !d.source)

  const handleSave = async () => {
    if (!selectedDoc) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/documents/${selectedDoc.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedDoc.title,
          content: editContent,
          tags: selectedDoc.tags
        })
      })
      
      if (res.ok) {
        setSelectedDoc({ ...selectedDoc, content: editContent })
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditContent(selectedDoc?.content || '')
    setIsEditing(false)
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Left Panel - Document List */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
        {/* Search & New */}
        <div className="p-4 border-b border-white/5">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/20 border-white/10"
            />
          </div>
          <Button 
            className="w-full bg-gradient-to-r from-[#4169E1] to-[#228B22] hover:opacity-90"
            onClick={() => window.location.href = '/dashboard/documents/new'}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <div className="p-4 text-white/40 text-center">Loading...</div>
          ) : (
            <>
              {/* Workspace Docs */}
              {workspaceDocs.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
                    <Brain className="h-3 w-3" />
                    Jess's Brain
                  </div>
                  {workspaceDocs.map(doc => (
                    <DocListItem
                      key={doc.slug}
                      doc={doc}
                      isSelected={selectedSlug === doc.slug}
                      onClick={() => {
                        setSelectedSlug(doc.slug)
                        setIsEditing(false)
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Regular Docs */}
              {regularDocs.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Documents
                  </div>
                  {regularDocs.map(doc => (
                    <DocListItem
                      key={doc.slug}
                      doc={doc}
                      isSelected={selectedSlug === doc.slug}
                      onClick={() => {
                        setSelectedSlug(doc.slug)
                        setIsEditing(false)
                      }}
                    />
                  ))}
                </div>
              )}

              {filteredDocs.length === 0 && (
                <div className="p-4 text-white/40 text-center text-sm">
                  No documents found
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Document View/Edit */}
      <div className="flex-1 flex flex-col bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
        {selectedDoc ? (
          <>
            {/* Document Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-white mb-2">{selectedDoc.title}</h1>
                  <div className="flex items-center gap-3 text-sm text-white/40">
                    <span>Updated {selectedDoc.updatedAt}</span>
                    {selectedDoc.source === 'workspace' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#4169E1]/10 text-[#4169E1] text-xs">
                        Synced with Jess
                      </span>
                    )}
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
              
              {selectedDoc.tags.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {selectedDoc.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/60 border border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Toolbar - shown when editing */}
              {isEditing && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <EditorToolbar editor={editor} />
                </div>
              )}
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-auto">
              {isEditing ? (
                <div className="p-8">
                  <WysiwygEditor
                    content={editContent}
                    onChange={setEditContent}
                    placeholder="Start writing..."
                    onEditorReady={setEditor}
                  />
                </div>
              ) : (
                <div className="p-8">
                  <div className="prose prose-invert prose-lg max-w-none prose-headings:font-semibold prose-headings:text-white prose-h1:text-3xl prose-h1:mt-6 prose-h1:mb-4 prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-xl prose-h3:mt-5 prose-h3:mb-2 prose-p:text-white/70 prose-p:leading-relaxed prose-p:my-3 prose-strong:text-white prose-em:text-white/80 prose-ul:text-white/70 prose-ul:my-3 prose-ol:text-white/70 prose-ol:my-3 prose-li:my-1 prose-blockquote:border-l-4 prose-blockquote:text-white/60 prose-blockquote:my-4 prose-hr:border-white/10 prose-hr:my-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedDoc.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/40">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a document to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DocListItem({ 
  doc, 
  isSelected, 
  onClick 
}: { 
  doc: DocumentMeta
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-3 py-2.5 rounded-lg transition-all
        ${isSelected 
          ? 'bg-[#4169E1]/10 border border-[#4169E1]/30' 
          : 'hover:bg-white/5 border border-transparent'
        }
      `}
    >
      <div className="font-medium text-sm text-white truncate">
        {doc.title.replace('🧠 ', '').replace('📝 ', '')}
      </div>
      <div className="text-xs text-white/40 mt-0.5">
        {doc.updatedAt}
      </div>
    </button>
  )
}
