'use client'

import { useState, useRef } from 'react'
import { FileUp, FileText, Trash2, Download, Image, FileCode, File, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ReferenceDocument {
  id: string
  title: string
  type: 'reference'
  content: string
  uploadedBy: string
  uploadedAt: string
}

interface ReferenceDocumentsProps {
  taskId: string
  documents: ReferenceDocument[]
  onDocumentsChange: () => void
  onViewDocument?: (doc: ReferenceDocument) => void
}

// File icon helper based on extension
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return <Image className="h-4 w-4 text-purple-400" />
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs'].includes(ext)) {
    return <FileCode className="h-4 w-4 text-green-400" />
  }
  if (['pdf'].includes(ext)) {
    return <FileText className="h-4 w-4 text-red-400" />
  }
  if (['md', 'txt', 'doc', 'docx'].includes(ext)) {
    return <FileText className="h-4 w-4 text-blue-400" />
  }
  return <File className="h-4 w-4 text-white/60" />
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

export default function ReferenceDocuments({ 
  taskId, 
  documents, 
  onDocumentsChange,
  onViewDocument
}: ReferenceDocumentsProps) {
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    
    try {
      for (const file of Array.from(files)) {
        // Read file content
        const content = await readFileAsBase64(file)
        
        const res = await fetch(`/api/tasks/${taskId}/reference-documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name,
            content: content,
            contentType: file.type
          })
        })

        if (!res.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }
      }
      
      toast.success('Document(s) uploaded', {
        description: `${files.length} file(s) added to task`
      })
      onDocumentsChange()
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed', {
        description: 'Could not upload the document(s)'
      })
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (docId: string, title: string) => {
    setDeletingId(docId)
    
    try {
      const res = await fetch(`/api/tasks/${taskId}/reference-documents/${docId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete document')
      }

      toast.success('Document removed', {
        description: title
      })
      onDocumentsChange()
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Delete failed', {
        description: 'Could not remove the document'
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDocumentClick = (doc: ReferenceDocument) => {
    if (onViewDocument) {
      onViewDocument(doc)
    } else {
      // Fallback: download the document
      downloadDocument(doc)
    }
  }

  const downloadDocument = (doc: ReferenceDocument) => {
    // Check if content is base64 encoded
    if (doc.content.startsWith('data:')) {
      const link = document.createElement('a')
      link.href = doc.content
      link.download = doc.title
      link.click()
    } else {
      // Plain text content
      const blob = new Blob([doc.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = doc.title
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <FileUp className="h-4 w-4 text-[#4169E1]" />
          Reference Documents
          {documents.length > 0 && (
            <span className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
              {documents.length}
            </span>
          )}
        </h3>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer"
              onClick={() => handleDocumentClick(doc)}
            >
              <div className="p-2 rounded-md bg-white/5">
                {getFileIcon(doc.title)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">
                  {doc.title}
                </p>
                <p className="text-xs text-white/40">
                  Uploaded {formatDate(doc.uploadedAt)}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadDocument(doc)
                  }}
                  className="text-white/40 hover:text-white hover:bg-white/10"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(doc.id, doc.title)
                  }}
                  disabled={deletingId === doc.id}
                  className="text-white/40 hover:text-red-400 hover:bg-red-400/10"
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleUploadClick}
        disabled={uploading}
        className="w-full border-dashed border-white/10 hover:border-[#4169E1]/50 hover:bg-[#4169E1]/5 text-white/60 hover:text-white"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <FileUp className="h-4 w-4 mr-2" />
            Upload Reference Doc
          </>
        )}
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Empty state */}
      {documents.length === 0 && !uploading && (
        <p className="text-xs text-white/30 text-center py-2">
          No reference documents yet
        </p>
      )}
    </div>
  )
}

// Helper to read file as base64
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
