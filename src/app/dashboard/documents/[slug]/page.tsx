import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDocument, getAllDocuments } from '@/lib/documents'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Calendar, Clock, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import DeleteDocumentButton from '@/components/documents/DeleteDocumentButton'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const documents = getAllDocuments()
  return documents.map((doc) => ({ slug: doc.slug }))
}

export default async function DocumentPage({ params }: Props) {
  const { slug } = await params
  const document = getDocument(slug)

  if (!document) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/dashboard/documents/${slug}/edit`}>
            <Button variant="outline" size="sm" className="border-white/10 hover:border-[#4169E1]/50 hover:bg-[#4169E1]/10">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <DeleteDocumentButton slug={slug} />
        </div>
      </div>

      {/* Document Card */}
      <article className="relative">
        {/* Subtle glow effect */}
        <div className="absolute -inset-px bg-gradient-to-r from-[#4169E1]/20 via-transparent to-[#228B22]/20 rounded-2xl blur-xl opacity-50" />
        
        <div className="relative bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
          {/* Document header */}
          <header className="p-8 pb-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-[#4169E1]/10 border border-[#4169E1]/20">
                <FileText className="h-6 w-6 text-[#4169E1]" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-white mb-2">{document.title}</h1>
                <div className="flex items-center gap-4 text-sm text-white/40">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Created {document.createdAt}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Updated {document.updatedAt}
                  </span>
                </div>
              </div>
            </div>
            
            {document.tags.length > 0 && (
              <div className="flex gap-2 mt-4">
                {document.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/60 border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Document content */}
          <div className="p-8">
            <div className="prose prose-invert prose-lg max-w-none
              prose-headings:font-semibold prose-headings:text-white
              prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
              prose-p:text-white/70 prose-p:leading-relaxed
              prose-a:text-[#4169E1] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-[#228B22] prose-code:bg-[#228B22]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
              prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl
              prose-ul:text-white/70 prose-ol:text-white/70
              prose-li:marker:text-[#4169E1]
              prose-blockquote:border-l-[#4169E1] prose-blockquote:text-white/60 prose-blockquote:bg-white/[0.02] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              prose-hr:border-white/10
            ">
              <ReactMarkdown>{document.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
