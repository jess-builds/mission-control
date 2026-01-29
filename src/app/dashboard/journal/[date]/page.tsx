import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getJournalEntry, getAllJournalEntries, getTodayDate } from '@/lib/journal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Props {
  params: Promise<{ date: string }>
}

export async function generateStaticParams() {
  const entries = getAllJournalEntries()
  return entries.map((entry) => ({ date: entry.date }))
}

export default async function JournalEntryPage({ params }: Props) {
  const { date } = await params
  const entry = getJournalEntry(date)
  const today = getTodayDate()

  if (!entry) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/journal">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Journal
          </Button>
        </Link>
      </div>

      {/* Entry */}
      <article className="bg-card border border-border rounded-lg p-8">
        <header className="mb-6 pb-6 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {date === today ? 'Today' : date}
              </h1>
              {entry.summary && (
                <p className="text-muted-foreground">{entry.summary}</p>
              )}
            </div>
          </div>
          
          {entry.topics.length > 0 && (
            <div className="flex gap-2 mt-4">
              {entry.topics.map((topic) => (
                <Badge key={topic} variant="outline">
                  {topic}
                </Badge>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown>{entry.content}</ReactMarkdown>
        </div>
      </article>
    </div>
  )
}
