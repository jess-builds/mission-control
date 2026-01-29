'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (res.ok) {
        router.push('/dashboard')
      } else {
        setError('Invalid credentials')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[#0a0a0b]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(65,105,225,0.15)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(34,139,34,0.1)_0%,_transparent_50%)]" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Login card */}
      <div 
        className={`relative w-full max-w-md transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-[#4169E1] via-transparent to-[#228B22] rounded-2xl blur-xl opacity-20" />
        
        <div className="relative bg-[#111113] border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-[#4169E1] blur-xl opacity-50" />
              <div className="relative h-14 w-14 rounded-xl bg-gradient-to-br from-[#4169E1] to-[#2850c8] flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">M</span>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Mission Control
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Your 2nd brain awaits
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                placeholder="armaan@missioncontrol.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 h-11 focus:border-[#4169E1] focus:ring-[#4169E1]/20"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 h-11 focus:border-[#4169E1] focus:ring-[#4169E1]/20"
                required
              />
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-[#4169E1] to-[#2850c8] hover:from-[#5b7fe8] hover:to-[#4169E1] text-white font-medium shadow-lg shadow-[#4169E1]/25 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-xs text-center text-zinc-600">
              Built by Jess • Powered by your ambition
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
