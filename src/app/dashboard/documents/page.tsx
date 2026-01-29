import Link from 'next/link'
import { getAllDocuments } from '@/lib/documents'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Plus } from 'lucide-react'

export default function DocumentsPage() {
  const documents = getAllDocuments()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Your knowledge base</p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first document to start building your knowledge base.
            </p>
            <Link href="/dashboard/documents/new">
              <Button>Create Document</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Link key={doc.slug} href={`/dashboard/documents/${doc.slug}`}>
              <Card className="bg-card border-border hover:border-blue-500/50 transition-colors cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="text-xs text-muted-foreground">{doc.updatedAt}</span>
                  </div>
                  <h3 className="font-medium mb-2">{doc.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
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
