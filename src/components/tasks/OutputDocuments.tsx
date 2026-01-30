'use client'

import { FileText, FileOutput, ClipboardCheck, Bot } from 'lucide-react'

interface OutputDocument {
  id: string
  title: string
  type: 'output' | 'handoff'
  content: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface OutputDocumentsProps {
  documents: OutputDocument[]
  onViewDocument: (doc: OutputDocument) => void
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

function DocumentCard({ 
  doc, 
  onClick 
}: { 
  doc: OutputDocument
  onClick: () => void 
}) {
  const isHandoff = doc.type === 'handoff'
  
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer"
    >
      <div className={`p-2 rounded-md ${isHandoff ? 'bg-amber-500/10' : 'bg-[#228B22]/10'}`}>
        {isHandoff ? (
          <ClipboardCheck className="h-4 w-4 text-amber-400" />
        ) : (
          <FileOutput className="h-4 w-4 text-[#228B22]" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white/90 truncate">
            {doc.title}
          </p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            isHandoff 
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
              : 'bg-[#228B22]/10 text-[#228B22] border border-[#228B22]/20'
          }`}>
            {isHandoff ? 'handoff' : 'output'}
          </span>
        </div>
        <p className="text-xs text-white/40 flex items-center gap-1.5">
          <Bot className="h-3 w-3" />
          {doc.createdBy} · {formatDate(doc.createdAt)}
        </p>
      </div>

      <FileText className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
    </div>
  )
}

export default function OutputDocuments({ documents, onViewDocument }: OutputDocumentsProps) {
  // Separate documents by type
  const outputDocs = documents.filter(d => d.type === 'output')
  const handoffDocs = documents.filter(d => d.type === 'handoff')
  
  const hasOutputDocs = outputDocs.length > 0
  const hasHandoffDocs = handoffDocs.length > 0
  const hasAnyDocs = hasOutputDocs || hasHandoffDocs

  return (
    <div className="space-y-5">
      {/* Output Documents Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <FileOutput className="h-4 w-4 text-[#228B22]" />
          Output Documents
          {hasOutputDocs && (
            <span className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
              {outputDocs.length}
            </span>
          )}
        </h3>

        {hasOutputDocs ? (
          <div className="space-y-2">
            {outputDocs.map((doc) => (
              <DocumentCard 
                key={doc.id} 
                doc={doc} 
                onClick={() => onViewDocument(doc)} 
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30 text-center py-3 border border-dashed border-white/5 rounded-lg">
            No output documents yet
          </p>
        )}
      </div>

      {/* Handoff Notes Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-amber-400" />
          Handoff Notes
          {hasHandoffDocs && (
            <span className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
              {handoffDocs.length}
            </span>
          )}
        </h3>

        {hasHandoffDocs ? (
          <div className="space-y-2">
            {handoffDocs.map((doc) => (
              <DocumentCard 
                key={doc.id} 
                doc={doc} 
                onClick={() => onViewDocument(doc)} 
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30 text-center py-3 border border-dashed border-white/5 rounded-lg">
            No handoff notes yet
          </p>
        )}
      </div>

      {/* Overall empty state */}
      {!hasAnyDocs && (
        <div className="text-center py-4 text-white/30 text-xs">
          <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Jess will create documents here as she works on this task</p>
        </div>
      )}
    </div>
  )
}
