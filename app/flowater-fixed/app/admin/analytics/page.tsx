'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Download } from 'lucide-react'
import { Question } from '@/types'

interface Response {
  created_at: string
  question_id: string
  answer_value: string
  survey_type: string
  session_id: string
}

export default function AnalyticsPage() {
  const [surveyType, setSurveyType] = useState<'public' | 'b2b'>('public')
  const [responses, setResponses] = useState<Response[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [exportMsg, setExportMsg] = useState('')

  useEffect(() => { loadData() }, [surveyType])

  async function loadData() {
    setLoading(true)
    const [{ data: q }, { data: r }] = await Promise.all([
      supabase.from('questions').select('*').eq('survey_type', surveyType).order('order_index'),
      supabase.from('responses').select('*').eq('survey_type', surveyType),
    ])
    if (q) setQuestions(q)
    if (r) setResponses(r)
    setLoading(false)
  }

  function getFrequency(questionId: string): Record<string, number> {
    const freq: Record<string, number> = {}
    responses.forEach((r) => {
      if (r.question_id !== questionId) return
      const values = r.answer_value?.split(',').map((v) => v.trim()).filter(Boolean) ?? []
      values.forEach((v) => { freq[v] = (freq[v] ?? 0) + 1 })
    })
    return freq
  }

  const uniqueSessions = new Set(responses.map((r) => r.session_id)).size

  function exportCSV() {
    if (!responses.length) {
      setExportMsg('No data to export yet.')
      setTimeout(() => setExportMsg(''), 3000)
      return
    }
    const headers = ['Date', 'Session ID', 'Question', 'Answer']
    const rows = responses.map((r) => {
      const q = questions.find((q) => q.id === r.question_id)
      return [new Date(r.created_at).toLocaleDateString(), r.session_id, `"${q?.title ?? r.question_id}"`, `"${r.answer_value}"`]
    })
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `freewater_${surveyType}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="text-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4" />
      <p className="text-white/40 text-sm">Loading analytics...</p>
    </div>
  )

  const summaryCards = [
    { label: 'Total Responses',    value: responses.length },
    { label: 'Unique Respondents', value: uniqueSessions },
    { label: 'Questions',          value: questions.length },
    { label: 'Active Questions',   value: questions.filter((q) => q.is_active).length },
  ]

  return (
    <div>
      {/* Header — wraps on small screens */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <p className="text-white/40 text-xs sm:text-sm mt-1">Real-time survey response data</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {exportMsg && (
            <span className="text-xs sm:text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg">{exportMsg}</span>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium text-sm"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs — scrollable on tiny screens */}
      <div className="mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit min-w-0">
          {(['public', 'b2b'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSurveyType(t)}
              className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${surveyType === t ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              {t === 'public' ? '💧 Citizen Survey' : '🏢 Business Survey'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards — 2 cols mobile, 4 cols lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {summaryCards.map(({ label, value }) => (
          <div key={label} className="bg-white/5 rounded-xl p-3 sm:p-4 md:p-5 border border-white/5">
            <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums">{value}</div>
            <div className="text-xs sm:text-sm text-white/40 mt-1 leading-snug">{label}</div>
          </div>
        ))}
      </div>

      {/* Per-question breakdown */}
      {questions.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white/5 rounded-2xl border border-white/10">
          <div className="text-4xl sm:text-5xl mb-4">📊</div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2">No questions yet</h3>
          <p className="text-white/40 text-sm">Create questions in the Questions tab to see analytics</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {questions.map((q) => {
            const freq = getFrequency(q.id)
            const total = Object.values(freq).reduce((a, b) => a + b, 0)
            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])

            return (
              <div key={q.id} className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/5">
                <h3 className="font-semibold text-sm text-white/80 mb-1 leading-snug break-words">{q.title}</h3>
                <p className="text-xs text-white/30 mb-3 sm:mb-4">
                  {total} {total === 1 ? 'response' : 'responses'} · {q.type.replace('_', ' ')}
                </p>
                {total === 0 ? (
                  <p className="text-white/20 text-sm">No responses yet</p>
                ) : (
                  <div className="space-y-2 sm:space-y-2.5">
                    {sorted.slice(0, 6).map(([label, count]) => {
                      const pct = Math.round((count / total) * 100)
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs text-white/60 mb-1">
                            <span className="truncate mr-2">{label}</span>
                            <span className="flex-shrink-0 tabular-nums">{pct}% ({count})</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                    {sorted.length > 6 && <p className="text-xs text-white/30">+{sorted.length - 6} more answers</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
