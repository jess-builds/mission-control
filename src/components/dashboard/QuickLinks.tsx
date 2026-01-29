'use client'

import { ExternalLink, Github, CheckSquare, BookOpen, Linkedin, Youtube, Instagram } from 'lucide-react'

interface QuickLink {
  name: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const LINKS: QuickLink[] = [
  {
    name: 'Blackboard',
    url: 'https://scad.blackboard.com',
    icon: BookOpen,
    color: 'bg-orange-500/20 text-orange-500'
  },
  {
    name: 'GitHub',
    url: 'https://github.com/MANG-03',
    icon: Github,
    color: 'bg-white/10 text-white'
  },
  {
    name: 'Todoist',
    url: 'https://todoist.com',
    icon: CheckSquare,
    color: 'bg-red-500/20 text-red-500'
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    icon: Linkedin,
    color: 'bg-blue-500/20 text-blue-500'
  },
  {
    name: 'YouTube',
    url: 'https://studio.youtube.com',
    icon: Youtube,
    color: 'bg-red-500/20 text-red-500'
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com',
    icon: Instagram,
    color: 'bg-pink-500/20 text-pink-500'
  }
]

export default function QuickLinks() {
  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
      <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
        <ExternalLink className="h-4 w-4 text-[#4169E1]" />
        Quick Links
      </h3>
      
      <div className="grid grid-cols-3 gap-2">
        {LINKS.map(link => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className={`p-2.5 rounded-lg ${link.color} transition-transform group-hover:scale-110`}>
              <link.icon className="h-4 w-4" />
            </div>
            <span className="text-xs text-white/60 group-hover:text-white transition-colors">
              {link.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
