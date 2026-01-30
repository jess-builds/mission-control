'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Edit3, Save, X, Loader2, FileText, ClipboardCheck, FileOutput } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
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

interface TaskDoc {
  id: string
  title: string
  type: 'output' | 'handoff' | 'reference'
  content: string
  createdBy?: string
  uploadedBy?: string
  createdAt?: string
  uploadedAt?: string
  updatedAt?: string
}

interface DocumentViewerProps {
  taskId: string
  document: TaskDoc
  onBack: () => void
  onSaved?: () => void
}

function getDocumentIcon(type: TaskDoc['type']) {
  switch (type) {
    case 'handoff':
      return <ClipboardCheck className="h-5 w-5 text-amber-400" />
    case 'output':
      return <FileOutput className="h-5 w-5 text-[#228B22]" />
    case 'reference':
    default:
      return <FileText className="h-5 w-5 text-[#4169E1]" />
  }
}

function getTypeBadge(type: TaskDoc['type']) {
  const styles: Record<string, string> = {
    handoff: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    output: 'bg-[#228B22]/10 text-[#228B22] border-[#228B22]/20',
    reference: 'bg-[#4169E1]/10 text-[#4169E1] border-[#4169E1]/20'
  }
  
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${styles[type]}`}>
      {type}
    </span>
  )
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Unknown'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

export default function DocumentViewer({ 
  taskId, 
  document: doc, 
  onBack, 
  onSaved 
}: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(doc.title)
  const [editContent, setEditContent] = useState(doc.content)
  const [saving, setSaving] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)

  // Reset edit state when document changes
  useEffect(() => {
    setEditTitle(doc.title)
    setEditContent(doc.content)
    setIsEditing(false)
  }, [doc.id])

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error('Title is required')
      return
    }

    setSaving(true)
    
    try {
      // Determine the API endpoint based on document type
      const endpoint = doc.type === 'reference'
        ? `/api/tasks/${taskId}/reference-documents/${doc.id}`
        : `/api/tasks/${taskId}/documents/${doc.id}`
      
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent
        })
      })

      if (!res.ok) {
        throw new Error('Failed to save document')
      }

      toast.success('Document saved')
      setIsEditing(false)
      onSaved?.()
    } catch (error) {
      console.error('Save failed:', error)
      toast.error('Failed to save document')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditTitle(doc.title)
    setEditContent(doc.content)
    setIsEditing(false)
  }

  // Check if document is an image (base64 data URL)
  const isImage = doc.content.startsWith('data:image/')
  // Check if it's a PDF
  const isPdf = doc.content.startsWith('data:application/pdf')
  // Check if content is viewable as markdown
  const isMarkdown = !isImage && !isPdf && !doc.content.startsWith('data:')

  // Reference documents are read-only
  const canEdit = doc.type !== 'reference' && isMarkdown

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0b]">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Task
        </Button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
                className="text-white/60 hover:text-white"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-[#228B22] hover:bg-[#228B22]/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </>
          ) : canEdit ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="border-white/10 hover:border-[#4169E1]/50 hover:bg-[#4169E1]/10"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : null}
        </div>
      </div>

      {/* Document Info */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${
            doc.type === 'handoff' 
              ? 'bg-amber-500/10 border border-amber-500/20' 
              : doc.type === 'output'
              ? 'bg-[#228B22]/10 border border-[#228B22]/20'
              : 'bg-[#4169E1]/10 border border-[#4169E1]/20'
          }`}>
            {getDocumentIcon(doc.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-lg font-semibold bg-white/5 border-white/10 mb-2"
                placeholder="Document title..."
              />
            ) : (
              <h2 className="text-lg font-semibold text-white mb-1 truncate">
                {doc.title}
              </h2>
            )}
            
            <div className="flex items-center gap-3 text-xs text-white/40">
              {getTypeBadge(doc.type)}
              <span>
                {doc.type === 'reference' 
                  ? `Uploaded by ${doc.uploadedBy || 'unknown'}` 
                  : `Created by ${doc.createdBy || 'unknown'}`
                }
              </span>
              <span>·</span>
              <span>
                {formatDate(doc.type === 'reference' ? doc.uploadedAt : doc.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar (when editing) */}
      {isEditing && (
        <div className="px-4 py-2 border-b border-white/5 bg-[#0a0a0b]">
          <EditorToolbar editor={editor} />
        </div>
      )}

      {/* Document Content */}
      <div className="flex-1 overflow-y-auto">
        {isImage ? (
          <div className="p-6 flex items-center justify-center">
            <img 
              src={doc.content} 
              alt={doc.title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg border border-white/10"
            />
          </div>
        ) : isPdf ? (
          <div className="p-6">
            <div className="text-center text-white/40 py-8">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-4">PDF documents cannot be previewed inline.</p>
              <Button
                variant="outline"
                onClick={() => {
                  const link = globalThis.document.createElement('a')
                  link.href = doc.content
                  link.download = doc.title
                  link.click()
                }}
              >
                Download PDF
              </Button>
            </div>
          </div>
        ) : isEditing ? (
          <div className="p-6 min-h-[400px]">
            <WysiwygEditor
              content={editContent}
              onChange={setEditContent}
              placeholder="Start writing..."
              onEditorReady={setEditor}
            />
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <div className="prose prose-invert prose-lg max-w-none
              prose-headings:font-semibold prose-headings:text-white prose-headings:mt-8 prose-headings:mb-4
              prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4
              prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
              prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
              prose-p:text-white/70 prose-p:leading-relaxed prose-p:my-3
              prose-a:text-[#4169E1] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-semibold
              prose-em:text-white/80
              prose-code:text-[#228B22] prose-code:bg-[#228B22]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
              prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-4 prose-pre:my-4
              prose-ul:text-white/70 prose-ul:my-3 prose-ul:space-y-1
              prose-ol:text-white/70 prose-ol:my-3 prose-ol:space-y-1
              prose-li:marker:text-[#4169E1] prose-li:leading-relaxed
              prose-blockquote:border-l-4 prose-blockquote:border-l-[#4169E1] prose-blockquote:text-white/60 prose-blockquote:bg-white/[0.02] prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:my-4 prose-blockquote:italic
              prose-hr:border-white/10 prose-hr:my-6
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {doc.content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
