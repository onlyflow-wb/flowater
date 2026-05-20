'use client'

import { useEffect, useState } from 'react'
import { Users, Droplet, Building2, Trash2, ChevronDown, ChevronUp, AlertTriangle, Search, Download } from 'lucide-react'

interface Helper { id: string; display_name: string; username: string }
interface Respondent {
  id: string; name: string; age: number; gender: string;
  location?: string; phone?: string; survey_type: 'public' | 'b2b' | 'helper';
  helper_id?: string; session_id: string; created_at: string
}
interface Response {
  id: string; session_id: string; question_id: string;
  answer_value: string; survey_type: string; created_at: string
}
interface Question { id: string; title: string; survey_type: string }

export default function DataPage() {
  const [respondents, setRespondents] = useState<Respondent[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [helpers, setHelpers] = useState<Helper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'public' | 'b2b' | 'helper'>('all')
  const [search, setSearch] = useState('')
  const [helperFilter, setHelperFilter] = useState<string>('all')
  const [deleteTarget, setDeleteTarget] = useState<Respondent | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/data')
      if (!res.ok) { const body = await res.json().catch(() => ({})); setError(body.error ?? 'Failed to load data'); setLoading(false); return }
      const { respondents: r, responses: ans, questions: q } = await res.json()
      setRespondents(r); setResponses(ans); setQuestions(q)
      const hRes = await fetch('/api/admin/helpers-list').catch(() => null)
      if (hRes?.ok) { const { helpers: h } = await hRes.json(); setHelpers(h ?? []) }
    } catch (e) { setError(String(e)) }
    setLoading(false)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true); setDeleteError('')
    try {
      const res = await fetch(`/api/admin/data?id=${deleteTarget.id}&session_id=${deleteTarget.session_id}`, { method: 'DELETE' })
      if (!res.ok) { const body = await res.json().catch(() => ({})); setDeleteError(body.error ?? 'Delete failed.'); setDeleting(false); return }
      const target = deleteTarget
      setDeleteTarget(null); setDeleting(false)
      setRespondents(prev => prev.filter(r => r.id !== target.id))
      setResponses(prev => prev.filter(r => r.session_id !== target.session_id))
    } catch (e) { setDeleteError(String(e)); setDeleting(false) }
  }

  function getAnswers(sessionId: string) { return responses.filter(r => r.session_id === sessionId) }
  function getQuestionTitle(questionId: string) { return questions.find(q => q.id === questionId)?.title ?? questionId }
  function getHelperName(helperId?: string) {
    if (!helperId) return null
    const h = helpers.find(h => h.id === helperId)
    return h ? h.display_name : null
  }

  const filtered = respondents.filter(r => {
    if (filter !== 'all' && r.survey_type !== filter) return false
    if (helperFilter !== 'all' && r.helper_id !== helperFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return r.name.toLowerCase().includes(s) || (r.location ?? '').toLowerCase().includes(s) || (r.phone ?? '').includes(s)
    }
    return true
  })

  function exportCSV() {
    const rows: string[][] = [['Name', 'Age', 'Gender', 'Location', 'Phone', 'Survey Type', 'Date', 'Question', 'Answer']]
    respondents.forEach(r => {
      const ans = getAnswers(r.session_id)
      if (ans.length === 0) {
        rows.push([r.name, String(r.age), r.gender, r.location ?? '', r.phone ?? '', r.survey_type, new Date(r.created_at).toLocaleDateString(), '', ''])
      } else {
        ans.forEach(a => { rows.push([r.name, String(r.age), r.gender, r.location ?? '', r.phone ?? '', r.survey_type, new Date(r.created_at).toLocaleDateString(), getQuestionTitle(a.question_id), a.answer_value]) })
      }
    })
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `flowater-data-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const surveyIcon = (type: string) => {
    if (type === 'b2b') return <Building2 className="w-3.5 h-3.5" />
    return <Droplet className="w-3.5 h-3.5" />
  }
  const surveyColor = (type: string) => {
    if (type === 'b2b') return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    if (type === 'helper') return 'text-green-400 bg-green-500/10 border-green-500/20'
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Data</h1>
          <p className="text-white/40 text-xs sm:text-sm mt-1">
            {respondents.length} respondents · {responses.length} answers
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all text-white/70 hover:text-white self-start sm:self-auto"
        >
          <Download className="w-4 h-4 flex-shrink-0" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          ⚠️ {error} <button onClick={load} className="ml-3 underline">Retry</button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, location or phone…"
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 outline-none focus:border-blue-500 text-sm transition-colors"
        />
      </div>

      {/* Filters — scrollable on mobile */}
      <div className="flex gap-2 mb-5 sm:mb-6 overflow-x-auto scrollbar-hide pb-1">
        {(['all', 'public', 'b2b', 'helper'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap flex-shrink-0 ${filter === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:text-white border border-white/10'}`}
          >
            {f}
          </button>
        ))}
        {helpers.length > 0 && (
          <select
            value={helperFilter}
            onChange={e => setHelperFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-white/70 outline-none focus:border-blue-500 cursor-pointer flex-shrink-0"
          >
            <option value="all">All helpers</option>
            {helpers.map(h => <option key={h.id} value={h.id}>{h.display_name}</option>)}
          </select>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 sm:py-20 text-white/20">
          <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'No results match your search' : 'No respondents yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const answers = getAnswers(r.session_id)
            const isOpen = expanded === r.id
            return (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {/* Row header */}
                <div
                  className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-xs sm:text-sm font-bold text-blue-400">
                    {r.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="font-semibold text-white text-xs sm:text-sm truncate">{r.name}</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${surveyColor(r.survey_type)}`}>
                        {surveyIcon(r.survey_type)}
                        <span className="hidden xs:inline">{r.survey_type}</span>
                      </span>
                      {r.survey_type === 'helper' && getHelperName(r.helper_id) && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border text-teal-400 bg-teal-500/10 border-teal-500/20">
                          👤 {getHelperName(r.helper_id)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5 truncate">
                      {r.age > 0 ? `${r.age} yrs · ` : ''}{r.gender !== 'Business' ? `${r.gender} · ` : ''}{r.location ?? ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                    <span className="text-xs text-white/30 hidden md:block">
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-xs text-white/40 bg-white/5 px-1.5 sm:px-2 py-1 rounded-lg tabular-nums">
                      {answers.length}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(r) }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                  </div>
                </div>

                {/* Expanded answers */}
                {isOpen && (
                  <div className="border-t border-white/5 px-3 sm:px-4 pb-3 sm:pb-4 pt-3">
                    {answers.length === 0 ? (
                      <p className="text-white/30 text-xs italic">No answers recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {answers.map((a, idx) => (
                          <div key={a.id} className="flex gap-2 sm:gap-3 text-sm">
                            <span className="text-white/20 text-xs pt-0.5 flex-shrink-0 w-4 sm:w-5">{idx + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-white/50 text-xs mb-0.5 leading-snug break-words">{getQuestionTitle(a.question_id)}</div>
                              <div className="text-white font-medium break-words text-sm">{a.answer_value || <span className="text-white/20 italic">—</span>}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="font-bold text-white">Delete Respondent</div>
                <div className="text-white/40 text-sm">This cannot be undone</div>
              </div>
            </div>
            <p className="text-white/60 text-sm mb-5 sm:mb-6">
              Delete <strong className="text-white">{deleteTarget.name}</strong> and all their {getAnswers(deleteTarget.session_id).length} answers?
            </p>
            {deleteError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">⚠️ {deleteError}</div>}
            <div className="flex gap-3">
              <button onClick={() => { setDeleteTarget(null); setDeleteError('') }} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 font-semibold text-sm">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
