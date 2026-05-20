'use client'

import { useState } from 'react'
import { Droplet } from 'lucide-react'

export default function AdminLogin() {
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
      const res = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: username.trim(), password }),
      })

      if (res.ok) {
        window.location.href = '/admin'
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Login failed. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-xl border border-white/10 p-8 text-white">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Droplet className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg text-white">FloWater Admin</span>
        </div>

        <h2 className="text-base font-semibold mb-5 text-white/60">Sign in to continue</h2>

        <div className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Username"
            autoComplete="username"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-white/30 transition-colors text-sm disabled:opacity-50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            autoComplete="current-password"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-white/30 transition-colors text-sm disabled:opacity-50"
          />

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-white/10 hover:bg-white/15 rounded-lg font-medium text-sm transition-colors mt-1 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
