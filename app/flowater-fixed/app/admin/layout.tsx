'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, HelpCircle, BarChart3, Settings, Menu, X, Droplet, LogOut, Users, Database, KeyRound } from 'lucide-react'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { path: '/admin/helpers', label: 'Helpers', icon: Users },
  { path: '/admin/data', label: 'Data', icon: Database },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark')
  const pathname = usePathname()

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') as 'dark' | 'light' | null
    if (saved) setThemeState(saved)
  }, [])

  useEffect(() => {
    function onThemeChange(e: Event) {
      const detail = (e as CustomEvent<'dark' | 'light'>).detail
      setThemeState(detail)
    }
    window.addEventListener('admin-theme-change', onThemeChange)
    return () => window.removeEventListener('admin-theme-change', onThemeChange)
  }, [])

  if (pathname.startsWith('/admin/login')) {
    return <>{children}</>
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/'
  }

  async function handleChangePassword() {
    setPwError('')
    if (!pwNew || pwNew.length < 4) { setPwError('New password must be at least 4 characters'); return }
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match'); return }
    setPwLoading(true)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: pwCurrent, new_password: pwNew }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwSuccess(true)
        setPwCurrent(''); setPwNew(''); setPwConfirm('')
      } else {
        setPwError(data.error ?? 'Failed to update password')
      }
    } catch { setPwError('Network error') }
    setPwLoading(false)
  }

  const isLight = theme === 'light'

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gradient-to-br from-slate-100 via-white to-slate-100 text-slate-900' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white'}`}>

      {/* Mobile header bar */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 h-14 border-b ${isLight ? 'bg-white/95 border-black/10' : 'bg-slate-900/95 border-white/10'} backdrop-blur-xl`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-2 rounded-lg ${isLight ? 'bg-black/5 text-slate-700 hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/15'} transition-colors flex-shrink-0`}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Droplet className="w-3.5 h-3.5 text-white" />
          </div>
          <span className={`font-bold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
            FloWater Admin
          </span>
        </div>
        {/* Current page name on mobile */}
        <span className={`ml-auto text-xs truncate ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
          {navItems.find(n => n.path === pathname)?.label ?? ''}
        </span>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 h-screen w-64 xl:w-72 backdrop-blur-xl border-r transform admin-sidebar lg:translate-x-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isLight ? 'bg-white/95 border-black/10' : 'bg-slate-900/95 border-white/10'}`
      }>
        {/* Sidebar header */}
        <div className={`p-5 xl:p-6 border-b flex items-center gap-3 flex-shrink-0 ${isLight ? 'border-black/10' : 'border-white/10'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Droplet className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className={`font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>FloWater</div>
            <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Admin Panel</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="p-3 xl:p-4 flex-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.path
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 rounded-xl mb-1 xl:mb-1.5 transition-all font-medium text-sm xl:text-base ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30'
                    : isLight
                      ? 'text-slate-500 hover:text-slate-900 hover:bg-black/5'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className={`p-3 xl:p-4 border-t flex-shrink-0 ${isLight ? 'border-black/10' : 'border-white/10'}`}>
          <button
            onClick={() => { setShowPwModal(true); setPwError(''); setPwSuccess(false) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-black/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <KeyRound className="w-4 h-4 flex-shrink-0" />
            <span>Change Password</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-medium text-sm mt-1"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content — accounts for mobile header height */}
      <main className="lg:ml-64 xl:ml-72 min-h-screen">
        <div className="pt-14 lg:pt-0 p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 max-w-screen-2xl">
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Change Password Modal */}
      {showPwModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl border p-5 sm:p-6 ${isLight ? 'bg-white border-black/10 text-slate-900' : 'bg-slate-900 border-white/10 text-white'}`}>
            <h2 className="text-lg font-bold mb-1">Change Admin Password</h2>
            <p className={`text-xs mb-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
              After confirming, update <code className="text-blue-500">ADMIN_PASS</code> in your{' '}
              <code className="text-blue-500">.env.local</code> to match.
            </p>
            {pwSuccess ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-green-500 font-semibold text-sm mb-3">Confirmed!</p>
                <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/50'}`}>
                  Now update <code className="text-blue-500">ADMIN_PASS</code> in .env.local and restart the server.
                </p>
                <button onClick={() => setShowPwModal(false)} className={`mt-4 px-4 py-2 rounded-xl text-sm transition-colors ${isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/10 hover:bg-white/20'}`}>Close</button>
              </div>
            ) : (
              <div className="space-y-3">
                <input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder="Current password"
                  className={`w-full p-3 rounded-xl border text-sm outline-none focus:border-blue-500 ${isLight ? 'bg-black/5 border-black/10 text-slate-900 placeholder:text-slate-400' : 'bg-white/10 border-white/15 text-white placeholder:text-white/30'}`} />
                <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="New password"
                  className={`w-full p-3 rounded-xl border text-sm outline-none focus:border-blue-500 ${isLight ? 'bg-black/5 border-black/10 text-slate-900 placeholder:text-slate-400' : 'bg-white/10 border-white/15 text-white placeholder:text-white/30'}`} />
                <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Confirm new password"
                  onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                  className={`w-full p-3 rounded-xl border text-sm outline-none focus:border-blue-500 ${isLight ? 'bg-black/5 border-black/10 text-slate-900 placeholder:text-slate-400' : 'bg-white/10 border-white/15 text-white placeholder:text-white/30'}`} />
                {pwError && <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{pwError}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowPwModal(false)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm transition-colors ${isLight ? 'bg-black/5 border-black/10 text-slate-500 hover:text-slate-900' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
                    Cancel
                  </button>
                  <button onClick={handleChangePassword} disabled={pwLoading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                    {pwLoading ? 'Checking…' : 'Update'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
