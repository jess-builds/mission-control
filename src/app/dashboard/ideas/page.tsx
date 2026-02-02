'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Plus, Search, Filter, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Idea {
  id: string
  title: string
  thumbnail: string
  summary: string
  status: 'new' | 'exploring' | 'planned' | 'building' | 'completed' | 'archived'
  source: 'journal' | 'nightly' | 'manual'
  createdAt: string
  updatedAt: string
  tags: string[]
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  new: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  exploring: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  planned: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  building: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  'in-progress': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  archived: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
}

const statusLabels: Record<string, string> = {
  new: '✨ New',
  exploring: '🔍 Exploring',
  planned: '📋 Planned',
  building: '🚧 Building',
  'in-progress': '🚧 In Progress',
  completed: '✅ Completed',
  archived: '📦 Archived',
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const res = await fetch('/api/ideas')
        if (res.ok) {
          const data = await res.json()
          setIdeas(data)
        }
      } catch (error) {
        console.error('Failed to fetch ideas:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchIdeas()
  }, [])

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = searchQuery === '' || 
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
              <Lightbulb className="h-6 w-6 text-amber-400" />
            </div>
            Idea Bank
          </h1>
          <p className="text-white/50 mt-2">Ideas worth exploring, from journals and beyond</p>
        </div>
        <Link href="/dashboard/ideas/new">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <Plus className="h-4 w-4 mr-2" />
            New Idea
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="idea-input-clean w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="idea-input-clean px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="new">✨ New</option>
            <option value="exploring">🔍 Exploring</option>
            <option value="planned">📋 Planned</option>
            <option value="building">🚧 Building</option>
            <option value="completed">✅ Completed</option>
            <option value="archived">📦 Archived</option>
          </select>
        </div>
      </div>

      {/* Ideas Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-white/40">
          <div className="text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-3 animate-pulse" />
            <p>Loading ideas...</p>
          </div>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-white/40">
          <Lightbulb className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg mb-2">No ideas yet</p>
          <p className="text-sm">Ideas from your nightly journals will appear here</p>
          <Link href="/dashboard/ideas/new">
            <Button variant="outline" className="mt-4 border-white/20 hover:bg-white/5">
              <Plus className="h-4 w-4 mr-2" />
              Add your first idea
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIdeas.map(idea => (
            <Link key={idea.id} href={`/dashboard/ideas/${idea.id}`}>
              <div className="group relative bg-[#111113] border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
                {/* Thumbnail Area */}
                <div className="h-32 bg-gradient-to-br from-white/[0.02] to-transparent flex items-center justify-center border-b border-white/5">
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {idea.thumbnail}
                  </span>
                </div>
                
                {/* Content */}
                <div className="p-5">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[idea.status].bg} ${statusColors[idea.status].text} border ${statusColors[idea.status].border}`}>
                      {statusLabels[idea.status]}
                    </span>
                    <span className="text-xs text-white/30">{formatDate(idea.createdAt)}</span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors">
                    {idea.title}
                  </h3>
                  
                  {/* Summary */}
                  <p className="text-sm text-white/50 line-clamp-2 mb-4">
                    {idea.summary || 'No summary yet'}
                  </p>
                  
                  {/* Tags */}
                  {idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {idea.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                          {tag}
                        </span>
                      ))}
                      {idea.tags.length > 3 && (
                        <span className="text-xs px-2 py-0.5 text-white/30">+{idea.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  {/* View More */}
                  <div className="flex items-center text-sm text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    View details
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
