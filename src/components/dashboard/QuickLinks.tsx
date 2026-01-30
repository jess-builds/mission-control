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
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 h-full flex flex-col">
      <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
        <ExternalLink className="h-4 w-4 text-[#4169E1]" />
        Quick Links
      </h3>
      
      <div className="grid grid-cols-3 gap-3 flex-1 place-content-center">
        {LINKS.map(link => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className={`p-4 rounded-xl ${link.color} transition-transform group-hover:scale-110 flex items-center justify-center`}>
              <link.icon className="h-7 w-7" />
            </div>
            <span className="text-sm text-white/60 group-hover:text-white transition-colors font-medium text-center">
              {link.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
