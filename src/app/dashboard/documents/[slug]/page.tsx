import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDocument, getAllDocuments } from '@/lib/documents'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
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
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/dashboard/documents/${slug}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <DeleteDocumentButton slug={slug} />
        </div>
      </div>

      {/* Document */}
      <article className="bg-card border border-border rounded-lg p-8">
        <header className="mb-6 pb-6 border-b border-border">
          <h1 className="text-3xl font-bold mb-3">{document.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Created: {document.createdAt}</span>
            <span>Updated: {document.updatedAt}</span>
          </div>
          {document.tags.length > 0 && (
            <div className="flex gap-2 mt-3">
              {document.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown>{document.content}</ReactMarkdown>
        </div>
      </article>
    </div>
  )
}
