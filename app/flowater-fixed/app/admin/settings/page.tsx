'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Trash2, AlertTriangle, X } from 'lucide-react'

export default function SettingsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Nuke modal state
  const [showNuke, setShowNuke] = useState(false)
  const [nukePassword, setNukePassword] = useState('')
  const [nukeError, setNukeError] = useState('')
  const [nukeLoading, setNukeLoading] = useState(false)
  const [nukeDone, setNukeDone] = useState(false)

  // Hydrate theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  function applyTheme(t: 'dark' | 'light') {
    setTheme(t)
    localStorage.setItem('admin-theme', t)
    // Notify the layout without a page reload
    window.dispatchEvent(new CustomEvent('admin-theme-change', { detail: t }))
  }

  async function handleNuke() {
    setNukeError('')
    setNukeLoading(true)
    try {
      const res = await fetch('/api/admin/nuke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: nukePassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setNukeDone(true)
      } else {
        setNukeError(data.error ?? 'Failed')
      }
    } catch {
      setNukeError('Network error')
    }
    setNukeLoading(false)
  }

  function closeNuke() {
    setShowNuke(false)
    setNukePassword('')
    setNukeError('')
    setNukeDone(false)
  }

  const isLight = theme === 'light'
  const cardClass = isLight
    ? 'bg-white border border-black/10 rounded-xl p-6 shadow-sm'
    : 'bg-white/5 border border-white/10 rounded-xl p-6'
  const headingClass = isLight ? 'text-slate-900' : 'text-white'
  const subClass = isLight ? 'text-slate-500' : 'text-white/50'

  return (
    <div>
      <h1 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 ${headingClass}`}>Settings</h1>

      {/* Appearance */}
      <div className={`${cardClass} mb-6`}>
        <h2 className={`text-xl font-semibold mb-1 ${headingClass}`}>Appearance</h2>
        <p className={`text-sm mb-4 ${subClass}`}>Choose how the admin panel looks.</p>
        <div className="flex gap-4">
          <button
            onClick={() => applyTheme('light')}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              theme === 'light'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : isLight
                  ? 'bg-black/5 border-black/10 text-slate-600 hover:border-black/20'
                  : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/15'
            }`}
          >
            <Sun className="w-6 h-6 mx-auto mb-2" />
            Light
          </button>
          <button
            onClick={() => applyTheme('dark')}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              theme === 'dark'
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : isLight
                  ? 'bg-black/5 border-black/10 text-slate-600 hover:border-black/20'
                  : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/15'
            }`}
          >
            <Moon className="w-6 h-6 mx-auto mb-2" />
            Dark
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-red-500 mb-1">Danger Zone</h2>
        <p className={`text-sm mb-5 ${subClass}`}>
          Irreversible actions. Helpers are <strong className={headingClass}>not</strong> affected.
        </p>
        <button
          onClick={() => setShowNuke(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Nuke All Data
        </button>
        <p className={`text-xs mt-3 ${subClass}`}>
          Deletes all <strong>responses</strong>, <strong>respondents</strong>, and <strong>questions</strong>.
        </p>
      </div>

      {/* Nuke confirmation modal */}
      {showNuke && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl border p-6 ${isLight ? 'bg-white border-black/10 text-slate-900' : 'bg-slate-900 border-white/10 text-white'}`}>
            {nukeDone ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🗑️</div>
                <p className="font-bold text-lg mb-1">Done</p>
                <p className={`text-sm mb-5 ${subClass}`}>All responses, respondents, and questions have been deleted. Helpers are untouched.</p>
                <button onClick={closeNuke} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <h2 className="text-lg font-bold">Nuke All Data</h2>
                  </div>
                  <button onClick={closeNuke} className={`p-1 rounded-lg transition-colors ${isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className={`text-sm mb-5 ${subClass}`}>
                  This will permanently delete <strong className={headingClass}>all responses, respondents, and questions</strong>. Helpers will be preserved. This cannot be undone.
                </p>

                <p className={`text-xs font-semibold mb-2 ${subClass}`}>Enter the nuke password to confirm:</p>
                <input
                  type="password"
                  value={nukePassword}
                  onChange={e => setNukePassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNuke()}
                  placeholder="Password"
                  autoFocus
                  className={`w-full p-3 rounded-xl border text-sm outline-none focus:border-red-500 mb-3 ${
                    isLight
                      ? 'bg-black/5 border-black/10 text-slate-900 placeholder:text-slate-400'
                      : 'bg-white/10 border-white/15 text-white placeholder:text-white/30'
                  }`}
                />

                {nukeError && (
                  <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{nukeError}</p>
                )}

                <div className="flex gap-2">
                  <button onClick={closeNuke}
                    className={`flex-1 py-2.5 rounded-xl border text-sm transition-colors ${isLight ? 'bg-black/5 border-black/10 text-slate-500 hover:text-slate-900' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
                    Cancel
                  </button>
                  <button onClick={handleNuke} disabled={nukeLoading || !nukePassword}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-50">
                    {nukeLoading ? 'Nuking…' : '💥 Confirm Nuke'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
