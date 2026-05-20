'use client'

import { useState } from 'react'
import { Droplet } from 'lucide-react'

export default function HelperLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/helper/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: username.trim().toLowerCase(), password }),
      })

      if (res.ok) {
        const { display_name, username: uname, id } = await res.json()
        // Store display-only data in localStorage (non-sensitive; auth is HttpOnly JWT)
        localStorage.setItem('helper_display', JSON.stringify({ display_name, username: uname, id }))
        window.location.href = '/helper'
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Invalid credentials or account inactive.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Droplet className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">FloWater</span>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 text-white">
          <h2 className="text-lg font-bold mb-1">Field Team Login</h2>
          <p className="text-white/40 text-sm mb-6">Enter your account credentials to continue</p>

          <div className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Username"
              autoCapitalize="none"
              autoComplete="username"
              disabled={loading}
              className="w-full p-4 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 outline-none focus:border-blue-500 transition-colors text-base disabled:opacity-50"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Password"
              autoComplete="current-password"
              disabled={loading}
              className="w-full p-4 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 outline-none focus:border-blue-500 transition-colors text-base disabled:opacity-50"
            />

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 active:opacity-90 rounded-xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
