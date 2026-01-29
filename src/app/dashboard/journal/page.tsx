import Link from 'next/link'
import { getAllJournalEntries, getTodayDate } from '@/lib/journal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Calendar } from 'lucide-react'

export default function JournalPage() {
  const entries = getAllJournalEntries()
  const today = getTodayDate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Journal</h1>
        <p className="text-muted-foreground">Daily summaries and reflections</p>
      </div>

      {entries.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No journal entries yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              Jess will create daily journal entries summarizing your conversations and progress.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Link key={entry.date} href={`/dashboard/journal/${entry.date}`}>
              <Card className="bg-card border-border hover:border-blue-500/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {entry.date === today ? 'Today' : entry.date}
                        </h3>
                        {entry.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                            {entry.summary}
                          </p>
                        )}
                      </div>
                    </div>
                    {entry.topics.length > 0 && (
                      <div className="flex gap-1">
                        {entry.topics.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
