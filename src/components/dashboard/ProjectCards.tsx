'use client'

import { Smartphone, Brain, Briefcase, Video, ArrowRight } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'planning'
  icon: React.ComponentType<{ className?: string }>
  color: string
  nextAction?: string
}

const PROJECTS: Project[] = [
  {
    id: 'debtless',
    name: 'Debtless',
    description: 'AI-powered debt management iOS app',
    status: 'active',
    icon: Smartphone,
    color: 'from-emerald-500 to-teal-500',
    nextAction: 'Fix App Store rejection issues'
  },
  {
    id: 'life-lab',
    name: 'Life Lab',
    description: '5-layer memory AI task management',
    status: 'planning',
    icon: Brain,
    color: 'from-purple-500 to-indigo-500',
    nextAction: 'Define architecture'
  },
  {
    id: 'clover',
    name: 'Clover Labs',
    description: 'Creative Director - LinkedIn & content',
    status: 'active',
    icon: Briefcase,
    color: 'from-blue-500 to-cyan-500',
    nextAction: 'Brain Dump OS posts'
  },
  {
    id: 'content',
    name: 'Content',
    description: 'YouTube, Instagram, TikTok',
    status: 'paused',
    icon: Video,
    color: 'from-red-500 to-orange-500',
    nextAction: 'Plan first video'
  }
]

export default function ProjectCards() {
  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">Active</span>
      case 'paused':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">Paused</span>
      case 'planning':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">Planning</span>
    }
  }

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <h3 className="font-semibold text-white">Projects</h3>
        <p className="text-xs text-white/40 mt-1">Active ventures & side projects</p>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-white/5">
        {PROJECTS.map(project => (
          <div 
            key={project.id}
            className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`
                p-2 rounded-lg bg-gradient-to-br ${project.color} opacity-80
              `}>
                <project.icon className="h-4 w-4 text-white" />
              </div>
              {getStatusBadge(project.status)}
            </div>
            
            <h4 className="font-medium text-white text-sm">{project.name}</h4>
            <p className="text-xs text-white/40 mt-1 line-clamp-1">{project.description}</p>
            
            {project.nextAction && (
              <div className="mt-3 flex items-center gap-1 text-xs text-[#4169E1] opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-3 w-3" />
                {project.nextAction}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
