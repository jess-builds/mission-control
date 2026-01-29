'use client'

import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sun, Moon, Search, Command, LogOut, Keyboard, User } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    // ⌘+? for shortcuts
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.key === '?' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowShortcuts(s => !s)
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false)
      }
    }
    document.addEventListener('keydown', handleShortcuts)
    return () => document.removeEventListener('keydown', handleShortcuts)
  }, [])

  const openQuickCapture = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true
    })
    document.dispatchEvent(event)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <>
      <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
        {/* Search */}
        <button
          onClick={openQuickCapture}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-ring/50 transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm hidden sm:inline">Search or create...</span>
          <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background border border-border text-xs font-mono">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Shortcuts hint */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            className="text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-1"
          >
            <Keyboard className="h-4 w-4" />
            <kbd className="text-xs font-mono">⌘?</kbd>
          </Button>

          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    A
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">Armaan Manji</p>
                <p className="text-xs text-muted-foreground">armaan@missioncontrol.com</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowShortcuts(true)}>
                <Keyboard className="mr-2 h-4 w-4" />
                Keyboard shortcuts
                <span className="ml-auto text-xs text-muted-foreground">⌘?</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h2>
            <div className="space-y-3">
              <ShortcutRow keys={['⌘', 'K']} description="Quick capture / Command palette" />
              <ShortcutRow keys={['⌘', '/']} description="Search" />
              <ShortcutRow keys={['⌘', 'N']} description="New document" />
              <ShortcutRow keys={['⌘', 'J']} description="Today's journal" />
              <div className="border-t border-border my-3" />
              <ShortcutRow keys={['⌘', '1']} description="Go to Dashboard" />
              <ShortcutRow keys={['⌘', '2']} description="Go to Documents" />
              <ShortcutRow keys={['⌘', '3']} description="Go to Tasks" />
              <ShortcutRow keys={['⌘', '4']} description="Go to Journal" />
              <div className="border-t border-border my-3" />
              <ShortcutRow keys={['Esc']} description="Close modal / Go back" />
            </div>
            <Button 
              onClick={() => setShowShortcuts(false)} 
              className="w-full mt-6"
              variant="outline"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

function ShortcutRow({ keys, description }: { keys: string[], description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <kbd 
            key={i}
            className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}
