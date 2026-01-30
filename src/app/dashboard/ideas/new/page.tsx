'use client'

import { useState } from 'react'
import { Lightbulb, ArrowLeft, Save, X, Sparkles, Workflow, Code, Users, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface IdeaForm {
  title: string
  thumbnail: string
  summary: string
  status: 'new' | 'exploring' | 'planned' | 'building' | 'completed' | 'archived'
  source: 'journal' | 'nightly' | 'manual'
  why: string
  flow: string
  implementation: string
  ux: string
  tags: string[]
}

const statusOptions = [
  { value: 'new', label: '✨ New' },
  { value: 'exploring', label: '🔍 Exploring' },
  { value: 'planned', label: '📋 Planned' },
  { value: 'building', label: '🚧 Building' },
]

const commonEmojis = ['💡', '🚀', '📱', '🤖', '💰', '📊', '🎯', '⚡', '🔧', '🎨', '📝', '🌟', '💎', '🔥', '🧠', '🎮']

export default function NewIdeaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [formData, setFormData] = useState<IdeaForm>({
    title: '',
    thumbnail: '💡',
    summary: '',
    status: 'new',
    source: 'manual',
    why: '',
    flow: '',
    implementation: '',
    ux: '',
    tags: [],
  })

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        const idea = await res.json()
        router.push(`/dashboard/ideas/${idea.id}`)
      }
    } catch (error) {
      console.error('Failed to create idea:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      })
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tagToRemove)
    })
  }

  const Section = ({ icon: Icon, title, field, placeholder }: { icon: any; title: string; field: keyof IdeaForm; placeholder: string }) => (
    <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Icon className="h-5 w-5 text-amber-400" />
          {title}
        </h3>
      </div>
      <div className="p-6">
        <textarea
          value={(formData[field] as string) || ''}
          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
          placeholder={placeholder}
          rows={6}
          className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
        />
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Link href="/dashboard/ideas" className="inline-flex items-center text-white/50 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Idea Bank
      </Link>

      {/* Header Card */}
      <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden mb-6">
        <div className="p-8 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <div className="flex items-start gap-6">
            {/* Thumbnail Picker */}
            <div className="flex-shrink-0 space-y-2">
              <div className="w-24 h-24 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center text-5xl">
                {formData.thumbnail}
              </div>
              <div className="flex flex-wrap gap-1 max-w-32">
                {commonEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setFormData({ ...formData, thumbnail: emoji })}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-lg hover:bg-white/10 transition-colors ${formData.thumbnail === emoji ? 'bg-amber-500/20 ring-1 ring-amber-500' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Meta */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="idea-input-clean text-3xl font-bold bg-transparent border-b border-white/20 text-white w-full pb-2 mb-4"
                placeholder="What's the big idea?"
                autoFocus
              />

              {/* Status */}
              <div className="flex items-center gap-4 mb-4">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as IdeaForm['status'] })}
                  className="px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Brief one-liner about this idea..."
                rows={2}
                className="idea-input-clean w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white/70 placeholder-white/30 resize-none"
              />

              {/* Tags */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Tag className="h-4 w-4 text-white/40" />
                {formData.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/60 border border-white/10 flex items-center gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tag..."
                    className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 w-20"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex gap-2">
              <Link href="/dashboard/ideas">
                <Button variant="outline" className="border-white/10">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleSave}
                disabled={saving || !formData.title.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Creating...' : 'Create Idea'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid gap-6">
        <Section
          icon={Sparkles}
          title="Why This is a Good Idea"
          field="why"
          placeholder="Explain why this idea is worth pursuing. What problem does it solve? What opportunity does it capture?"
        />
        
        <Section
          icon={Workflow}
          title="How It Fits Our Flow"
          field="flow"
          placeholder="Describe how this integrates with existing systems, workflows, or projects. What does it connect to?"
        />
        
        <Section
          icon={Code}
          title="Implementation Plan"
          field="implementation"
          placeholder="Outline the technical approach. What needs to be built? What are the key components? What's the rough timeline?"
        />
        
        <Section
          icon={Users}
          title="User Experience Walkthrough"
          field="ux"
          placeholder="Walk through the user journey. What does the user see, do, and experience? How do they interact with this?"
        />
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={handleSave}
          disabled={saving || !formData.title.trim()}
          size="lg"
          className="bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 disabled:opacity-50"
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Creating...' : 'Create Idea'}
        </Button>
      </div>
    </div>
  )
}
