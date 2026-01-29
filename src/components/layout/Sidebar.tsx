'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  BookOpen,
  Search,
  Command
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: '1' },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText, shortcut: '2' },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare, shortcut: '3' },
  { name: 'Journal', href: '/dashboard/journal', icon: BookOpen, shortcut: '4' },
  { name: 'Search', href: '/dashboard/search', icon: Search, shortcut: '/' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-60 bg-sidebar border-r border-border flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center mr-2.5">
          <span className="text-xs font-bold text-white">M</span>
        </div>
        <span className="text-sm font-semibold text-foreground">Mission Control</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors group',
                isActive
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <div className="flex items-center">
                <item.icon className="h-4 w-4 mr-2.5" />
                {item.name}
              </div>
              <kbd className={cn(
                'hidden group-hover:flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-mono',
                isActive ? 'bg-background/50' : 'bg-muted'
              )}>
                <Command className="h-2.5 w-2.5" />{item.shortcut}
              </kbd>
            </Link>
          )
        })}
      </nav>

      {/* Status bar */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Jess is active</span>
        </div>
      </div>
    </div>
  )
}
