'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, X } from 'lucide-react'

const AVAILABLE_TAGS = ['SCAD', 'Clover', 'Debtless', 'Life Lab', 'Content', 'Personal', 'Concept', 'Reference']

export default function NewDocumentPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setSaving] = useState(false)
  const router = useRouter()

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const toggleTag = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSave = async () => {
    if (!title.trim()) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title, content, tags })
      })
      
      if (res.ok) {
        router.push(`/dashboard/documents/${slug}`)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save document:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <Button 
          onClick={handleSave} 
          disabled={!title.trim() || loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Document'}
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>New Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title..."
              className="text-lg"
            />
            {slug && (
              <p className="text-xs text-muted-foreground mt-1">
                Slug: {slug}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={tags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {tags.includes(tag) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Content (Markdown)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your document content here... (Markdown supported)"
              className="w-full h-96 p-4 bg-background border border-input rounded-md text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
