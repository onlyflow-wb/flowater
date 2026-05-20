'use client'

import { useEffect, useState } from 'react'
import { Users, CheckCircle, Droplet, Building2, Activity, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalResponses: 0, uniqueRespondents: 0, publicResponses: 0,
    b2bResponses: 0, totalQuestions: 0, activeQuestions: 0, acceptanceRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<{ date: string; type: string; count: number }[]>([])

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/data')
      if (!res.ok) { setLoading(false); return }
      const { responses, questions } = await res.json()
      if (responses) {
        const uniqueSessions = new Set(responses.map((r: {session_id: string}) => r.session_id)).size
        const publicRes  = responses.filter((r: {survey_type: string}) => r.survey_type === 'public').length
        const b2bRes     = responses.filter((r: {survey_type: string}) => r.survey_type === 'b2b').length
        const yesCount   = responses.filter((r: {answer_value: string}) => r.answer_value === 'yes').length
        const noCount    = responses.filter((r: {answer_value: string}) => r.answer_value === 'no').length
        const totalYN    = yesCount + noCount
        const acceptance = totalYN > 0 ? Math.round((yesCount / totalYN) * 100) : 0
        const byDay: Record<string, number> = {}
        responses.forEach((r: {created_at: string}) => {
          const day = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          byDay[day] = (byDay[day] || 0) + 1
        })
        const sortedDays = Object.entries(byDay)
          .map(([date, count]) => ({ date, type: 'response', count }))
          .slice(-7)
        setRecentActivity(sortedDays)
        setStats(prev => ({ ...prev, totalResponses: responses.length, uniqueRespondents: uniqueSessions, publicResponses: publicRes, b2bResponses: b2bRes, acceptanceRate: acceptance }))
      }
      if (questions) {
        setStats(prev => ({ ...prev, totalQuestions: questions.length, activeQuestions: questions.filter((q: {is_active: boolean}) => q.is_active).length }))
      }
    } catch { /* keep zeroes */ }
    setLoading(false)
  }

  const cards = [
    { label: 'Total Responses',     value: stats.totalResponses,   icon: Activity,    color: 'blue',   sub: 'All answers submitted' },
    { label: 'Unique Respondents',  value: stats.uniqueRespondents, icon: Users,       color: 'cyan',   sub: 'Individual sessions' },
    { label: 'Citizen Responses',   value: stats.publicResponses,  icon: Droplet,     color: 'teal',   sub: 'Public survey' },
    { label: 'Business Responses',  value: stats.b2bResponses,     icon: Building2,   color: 'purple', sub: 'B2B survey' },
    { label: 'Active Questions',    value: `${stats.activeQuestions}/${stats.totalQuestions}`, icon: CheckCircle, color: 'green', sub: 'Enabled questions' },
    { label: 'Acceptance Rate',     value: `${stats.acceptanceRate}%`, icon: TrendingUp, color: 'orange', sub: 'Yes vs No answers' },
  ]

  const colorMap: Record<string, string> = {
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    cyan:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    teal:   'text-teal-400 bg-teal-500/10 border-teal-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    green:  'text-green-400 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        <p className="text-white/40 text-sm">Loading dashboard...</p>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-xs sm:text-sm mt-1">FloWater · Water Access Data Overview</p>
      </div>

      {/* Stats grid — 2 cols on mobile, 3 on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-10">
        {cards.map(({ label, value, icon: Icon, color, sub }) => {
          const [textCls, bgCls, borderCls] = colorMap[color].split(' ')
          return (
            <div key={label} className={`rounded-2xl p-4 sm:p-5 md:p-6 border bg-white/5 ${bgCls} ${borderCls}`}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${textCls} bg-white/10`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className={`text-2xl sm:text-3xl font-extrabold mb-0.5 sm:mb-1 tabular-nums ${textCls}`}>{value}</div>
              <div className="text-white/80 font-medium text-xs sm:text-sm leading-snug">{label}</div>
              <div className="text-white/30 text-xs mt-0.5 hidden sm:block">{sub}</div>
            </div>
          )
        })}
      </div>

      {/* Recent activity */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 sm:py-10">
            <div className="text-3xl sm:text-4xl mb-3">📊</div>
            <p className="text-white/40 text-xs sm:text-sm">No responses yet. Share the survey links to start collecting data.</p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {recentActivity.map(({ date, count }) => {
              const max = Math.max(...recentActivity.map(r => r.count))
              const pct = Math.round((count / max) * 100)
              return (
                <div key={date} className="flex items-center gap-2 sm:gap-4">
                  <span className="text-white/40 text-xs w-16 sm:w-20 flex-shrink-0">{date}</span>
                  <div className="flex-1 h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-white/60 text-xs w-12 sm:w-16 text-right tabular-nums">{count} resp.</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
