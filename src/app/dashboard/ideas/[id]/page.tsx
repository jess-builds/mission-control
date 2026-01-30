'use client'

import { useState, useEffect, use } from 'react'
import { Lightbulb, ArrowLeft, Edit3, Save, X, Trash2, Calendar, Tag, Sparkles, Workflow, Code, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Idea {
  id: string
  title: string
  thumbnail: string
  summary: string
  status: 'new' | 'exploring' | 'planned' | 'building' | 'completed' | 'archived'
  source: 'journal' | 'nightly' | 'manual'
  sourceDate?: string
  createdAt: string
  updatedAt: string
  why: string
  flow: string
  implementation: string
  ux: string
  tags: string[]
}

const statusOptions = [
  { value: 'new', label: '✨ New', color: 'blue' },
  { value: 'exploring', label: '🔍 Exploring', color: 'purple' },
  { value: 'planned', label: '📋 Planned', color: 'amber' },
  { value: 'building', label: '🚧 Building', color: 'green' },
  { value: 'completed', label: '✅ Completed', color: 'emerald' },
  { value: 'archived', label: '📦 Archived', color: 'gray' },
]

const commonEmojis = ['💡', '🚀', '📱', '🤖', '💰', '📊', '🎯', '⚡', '🔧', '🎨', '📝', '🌟', '💎', '🔥', '🧠', '🎮']

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Idea>>({})
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    const fetchIdea = async () => {
      try {
        const res = await fetch(`/api/ideas/${id}`)
        if (res.ok) {
          const data = await res.json()
          setIdea(data)
          setEditData(data)
        } else {
          router.push('/dashboard/ideas')
        }
      } catch (error) {
        console.error('Failed to fetch idea:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchIdea()
  }, [id, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })
      if (res.ok) {
        const updated = await res.json()
        setIdea(updated)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/ideas')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !editData.tags?.includes(newTag.trim())) {
      setEditData({
        ...editData,
        tags: [...(editData.tags || []), newTag.trim()]
      })
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setEditData({
      ...editData,
      tags: editData.tags?.filter(t => t !== tagToRemove) || []
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40">
        <Sparkles className="h-8 w-8 animate-pulse" />
      </div>
    )
  }

  if (!idea) return null

  const Section = ({ icon: Icon, title, field, placeholder }: { icon: any; title: string; field: keyof Idea; placeholder: string }) => (
    <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Icon className="h-5 w-5 text-amber-400" />
          {title}
        </h3>
      </div>
      <div className="p-6">
        {isEditing ? (
          <textarea
            value={(editData[field] as string) || ''}
            onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
            placeholder={placeholder}
            rows={6}
            className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
          />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:text-white/70 prose-headings:text-white prose-li:text-white/70 prose-strong:text-white">
            {idea[field] ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{idea[field] as string}</ReactMarkdown>
            ) : (
              <p className="text-white/30 italic">Not yet documented</p>
            )}
          </div>
        )}
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
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="w-24 h-24 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center text-5xl">
                    {editData.thumbnail || '💡'}
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-32">
                    {commonEmojis.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setEditData({ ...editData, thumbnail: emoji })}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-lg hover:bg-white/10 transition-colors ${editData.thumbnail === emoji ? 'bg-amber-500/20 ring-1 ring-amber-500' : ''}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center text-5xl">
                  {idea.thumbnail}
                </div>
              )}
            </div>

            {/* Title & Meta */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="text-3xl font-bold bg-transparent border-b border-white/20 text-white w-full focus:outline-none focus:border-amber-500 pb-2 mb-4"
                  placeholder="Idea title"
                />
              ) : (
                <h1 className="text-3xl font-bold text-white mb-3">{idea.title}</h1>
              )}

              {/* Status */}
              <div className="flex items-center gap-4 mb-4">
                {isEditing ? (
                  <select
                    value={editData.status || 'new'}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as Idea['status'] })}
                    className="px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {statusOptions.find(s => s.value === idea.status)?.label}
                  </span>
                )}
                <span className="text-sm text-white/40 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(idea.createdAt)}
                </span>
              </div>

              {/* Summary */}
              {isEditing ? (
                <textarea
                  value={editData.summary || ''}
                  onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                  placeholder="Brief one-liner about this idea..."
                  rows={2}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white/70 placeholder-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              ) : (
                <p className="text-white/60">{idea.summary || 'No summary'}</p>
              )}

              {/* Tags */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Tag className="h-4 w-4 text-white/40" />
                {isEditing ? (
                  <>
                    {editData.tags?.map(tag => (
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
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Add tag..."
                        className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 w-20"
                      />
                    </div>
                  </>
                ) : (
                  idea.tags.length > 0 ? idea.tags.map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/60 border border-white/10">
                      {tag}
                    </span>
                  )) : (
                    <span className="text-xs text-white/30">No tags</span>
                  )
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditData(idea)
                      setIsEditing(false)
                    }}
                    className="border-white/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-2">Delete this idea?</h3>
            <p className="text-white/60 mb-6">This action cannot be undone. The idea will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="border-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
