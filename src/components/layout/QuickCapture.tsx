'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  FileText,
  CheckSquare,
  BookOpen,
  Search,
  Plus,
  LayoutDashboard
} from 'lucide-react'

export default function QuickCapture() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/documents'))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Go to Documents</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/tasks'))}>
            <CheckSquare className="mr-2 h-4 w-4" />
            <span>Go to Tasks</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/journal'))}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Go to Journal</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Create">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/documents/new'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Document</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/tasks?new=true'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Task</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Search">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/search'))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search Everything</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
