'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Command } from 'lucide-react'

export default function SearchPage() {
  const router = useRouter()

  useEffect(() => {
    // Open the command search modal
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true
    })
    document.dispatchEvent(event)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-6">
        <Search className="h-12 w-12 text-white/30" />
      </div>
      <h1 className="text-2xl font-semibold text-white mb-2">Universal Search</h1>
      <p className="text-white/50 mb-6 max-w-md">
        Search has been upgraded! Use the command palette to search everything in one place.
      </p>
      <button
        onClick={() => {
          const event = new KeyboardEvent('keydown', {
            key: 'k',
            metaKey: true,
            bubbles: true
          })
          document.dispatchEvent(event)
        }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4169E1] text-white hover:bg-[#4169E1]/90 transition-colors"
      >
        <span>Open Search</span>
        <kbd className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-white/20 text-xs font-mono">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>
    </div>
  )
}
