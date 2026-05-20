'use client'

import { useEffect, useState, useCallback } from 'react'
import { Question } from '@/types'
import { QuestionRenderer } from '@/components/surveys/QuestionRenderer'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '@/lib/api-client'
import { generateUUID as createUUID } from '@/utils/uuid'
import {
  ArrowLeft, ArrowRight, CheckCircle, Plus, LogOut, Edit2, User,
  ChevronRight, Trash2, AlertTriangle, KeyRound, Building2, Users,
} from 'lucide-react'

// UUID polyfill — crypto.randomUUID() is undefined on some older Android browsers
type AnswerValue = string | string[] | number

interface HelperSession { id: string; username: string; display_name: string }
interface PersonalInfo { name: string; age: string; gender: string; location: string; phone: string }
interface BusinessInfo { business_name: string; contact_name: string; location: string; phone: string }
interface RespondentRecord {
  id: string; name: string; age: number; gender: string; location: string
  phone: string; session_id: string; survey_type: string; created_at: string
}

type SurveyChoice = 'individual' | 'business'
type View = 'list' | 'type-choice' | 'personal-info' | 'business-info' | 'survey' | 'success'

const emptyInfo: PersonalInfo = { name: '', age: '', gender: '', location: '', phone: '' }
const emptyBusiness: BusinessInfo = { business_name: '', contact_name: '', location: '', phone: '' }
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say']

export default function HelperPage() {
  const [helper, setHelper] = useState<HelperSession | null>(null)
  const [view, setView] = useState<View>('list')
  const [surveyChoice, setSurveyChoice] = useState<SurveyChoice>('individual')

  const [publicQuestions, setPublicQuestions] = useState<Question[]>([])
  const [b2bQuestions, setB2bQuestions] = useState<Question[]>([])

  const [todayRespondents, setTodayRespondents] = useState<RespondentRecord[]>([])
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(emptyInfo)
  const [infoError, setInfoError] = useState('')
  const [editingRespondent, setEditingRespondent] = useState<RespondentRecord | null>(null)

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(emptyBusiness)
  const [businessError, setBusinessError] = useState('')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [currentSessionId, setCurrentSessionId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<RespondentRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const [showPwModal, setShowPwModal] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    fetch('/api/helper/me')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setHelper({ id: data.id, username: data.username, display_name: data.display_name }))
      .catch(() => { window.location.href = '/helper/login' })
  }, [])

  useEffect(() => {
    async function load() {
      const [pub, b2b] = await Promise.all([
        fetch('/api/public/questions?survey_type=public'),
        fetch('/api/public/questions?survey_type=b2b'),
      ])
      const pubData = await pub.json().catch(() => null)
      const b2bData = await b2b.json().catch(() => null)
      if (pub.ok) setPublicQuestions(pubData?.questions ?? [])
      if (b2b.ok) setB2bQuestions(b2bData?.questions ?? [])
    }
    load()
  }, [])

  const loadTodayRespondents = useCallback(async () => {
    try {
      const res = await fetch('/api/helper/respondents')
      if (res.ok) {
        const { respondents } = await res.json()
        setTodayRespondents(respondents ?? [])
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (helper) loadTodayRespondents()
  }, [helper, loadTodayRespondents])

  async function logout() {
    await apiFetch('/api/helper/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/helper/login'
  }

  async function handleChangePassword() {
    setPwError('')
    if (!pwNew || pwNew.length < 4) { setPwError('New password must be at least 4 characters'); return }
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match'); return }
    setPwLoading(true)
    try {
      const res = await apiFetch('/api/helper/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: pwCurrent, new_password: pwNew }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwSuccess(true)
        setPwCurrent(''); setPwNew(''); setPwConfirm('')
        setTimeout(() => { setShowPwModal(false); setPwSuccess(false) }, 1500)
      } else {
        setPwError(data.error ?? 'Failed to update password')
      }
    } catch { setPwError('Network error') }
    setPwLoading(false)
  }

  async function handlePersonalInfoSubmit() {
    setInfoError('')
    if (!personalInfo.name.trim()) { setInfoError('Name is required.'); return }
    if (!personalInfo.age || isNaN(Number(personalInfo.age)) || Number(personalInfo.age) < 1 || Number(personalInfo.age) > 120) {
      setInfoError('Please enter a valid age.'); return
    }
    if (!personalInfo.gender) { setInfoError('Please select a gender.'); return }
    if (!personalInfo.location.trim()) { setInfoError('Location is required.'); return }

    if (editingRespondent) {
      const res = await apiFetch('/api/helper/respondents', {
        method: 'PATCH',
        body: JSON.stringify({
        id: editingRespondent.id,
        name: personalInfo.name.trim(), age: Number(personalInfo.age),
        gender: personalInfo.gender, location: personalInfo.location.trim(),
        phone: personalInfo.phone.trim() || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setInfoError('Save failed: ' + (body.error ?? 'Please try again.'))
        return
      }
      if (helper) loadTodayRespondents()
      setEditingRespondent(null); setPersonalInfo(emptyInfo); setView('list'); return
    }

    const newSessionId = createUUID()
    setCurrentSessionId(newSessionId)
    const res = await apiFetch('/api/helper/respondents', {
      method: 'POST',
      body: JSON.stringify({
      name: personalInfo.name.trim(), age: Number(personalInfo.age),
      gender: personalInfo.gender, location: personalInfo.location.trim(),
      phone: personalInfo.phone.trim() || null,
      survey_type: 'helper', session_id: newSessionId,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setInfoError('Save failed: ' + (body.error ?? 'Please try again.'))
      return
    }
    setAnswers({}); setCurrentIndex(0); setView('survey')
  }

  async function handleBusinessInfoSubmit() {
    setBusinessError('')
    if (!businessInfo.business_name.trim()) { setBusinessError('Business name is required.'); return }
    if (!businessInfo.location.trim()) { setBusinessError('Location is required.'); return }

    const newSessionId = createUUID()
    setCurrentSessionId(newSessionId)

    const fullName = businessInfo.contact_name.trim()
      ? `${businessInfo.business_name.trim()} — ${businessInfo.contact_name.trim()}`
      : businessInfo.business_name.trim()

    const res = await apiFetch('/api/helper/respondents', {
      method: 'POST',
      body: JSON.stringify({
      name: fullName, age: 0, gender: 'Business',
      location: businessInfo.location.trim(),
      phone: businessInfo.phone.trim() || null,
      survey_type: 'b2b', session_id: newSessionId,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setBusinessError('Save failed: ' + (body.error ?? 'Please try again.'))
      return
    }
    setAnswers({}); setCurrentIndex(0); setView('survey')
  }

  async function handleSurveySubmit() {
    if (submitting) return
    setSubmitting(true)
    const activeSurveyType = surveyChoice === 'business' ? 'b2b' : 'public'
    const responses = Object.entries(answers).map(([questionId, answerValue]) => ({
      session_id: currentSessionId,
      question_id: questionId,
      answer_value: Array.isArray(answerValue) ? answerValue.join(',') : String(answerValue),
      survey_type: activeSurveyType,
    }))
    if (responses.length > 0) {
      await apiFetch('/api/public/responses', {
        method: 'POST',
        body: JSON.stringify({ responses }),
      })
    }
    setSubmitting(false)
    if (helper) loadTodayRespondents()
    setView('success')
  }

  async function handleDelete() {
    if (!deleteTarget || !helper) return
    setDeleting(true); setDeleteError('')
    try {
      const params = new URLSearchParams({ id: deleteTarget.id, session_id: deleteTarget.session_id })
      const res = await apiFetch(`/api/helper/respondents?${params}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setDeleteError(body.error ?? 'Delete failed.'); setDeleting(false); return
      }
      const target = deleteTarget
      setDeleteTarget(null); setDeleting(false)
      setTodayRespondents(prev => prev.filter(r => r.id !== target.id))
    } catch (e) { setDeleteError(String(e)); setDeleting(false) }
  }

  function startNew() {
    setPersonalInfo(emptyInfo); setBusinessInfo(emptyBusiness)
    setEditingRespondent(null); setInfoError(''); setBusinessError('')
    setView('type-choice')
  }

  function startEdit(r: RespondentRecord) {
    setEditingRespondent(r)
    setPersonalInfo({ name: r.name, age: String(r.age), gender: r.gender, location: r.location || '', phone: r.phone || '' })
    setInfoError(''); setView('personal-info')
  }

  const activeQuestions = surveyChoice === 'business' ? b2bQuestions : publicQuestions
  const currentQuestion = activeQuestions[currentIndex] ?? null
  const isLast = currentIndex === activeQuestions.length - 1
  const progress = activeQuestions.length > 0 ? ((currentIndex + 1) / activeQuestions.length) * 100 : 0

  const canProceed = (() => {
    if (!currentQuestion) return true
    if (!currentQuestion.required) return true
    const ans = answers[currentQuestion.id]
    if (ans === undefined || ans === null) return false
    if (typeof ans === 'string') return ans.trim() !== ''
    if (Array.isArray(ans)) return ans.length > 0
    return typeof ans === 'number'
  })()

  if (!helper) return null

  // ── LIST ──
  if (view === 'list') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 pb-24" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Hello, {helper.display_name.split(' ')[0]} 👋</h1>
            <p className="text-white/40 text-sm">{todayRespondents.length} entries added today</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setShowPwModal(true); setPwError(''); setPwSuccess(false) }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white active:bg-white/15 transition-all" title="Change password">
              <KeyRound className="w-4 h-4" />
            </button>
            <button type="button" onClick={logout}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white active:bg-white/15 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button type="button" onClick={startNew}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 active:opacity-90 rounded-2xl font-bold text-base transition-all active:scale-[0.98] mb-6">
          <Plus className="w-5 h-5" /> Add New Entry
        </button>

        {todayRespondents.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Today&apos;s Entries</h2>
            <div className="space-y-2">
              {todayRespondents.map(r => {
                const isBiz = r.survey_type === 'b2b' || r.gender === 'Business'
                return (
                  <div key={r.id} className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl">
                    <button type="button" onClick={() => !isBiz && startEdit(r)}
                      className={`flex-1 flex items-center gap-3 text-left min-w-0 ${isBiz ? 'cursor-default' : ''}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border ${
                        isBiz ? 'bg-purple-500/20 border-purple-500/30' : 'bg-blue-500/20 border-blue-500/30'}`}>
                        {isBiz ? <Building2 className="w-4 h-4 text-purple-400" /> : <User className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-white truncate">{r.name}</div>
                        <div className="text-xs text-white/40">
                          {isBiz ? `📍 ${r.location}${r.phone ? ` · ${r.phone}` : ''}` : `${r.age} yrs · ${r.gender} · ${r.location}`}
                        </div>
                      </div>
                      {!isBiz && <div className="flex items-center gap-1 text-white/30 flex-shrink-0"><Edit2 className="w-3.5 h-3.5" /><ChevronRight className="w-4 h-4" /></div>}
                    </button>
                    <button type="button" onClick={() => { setDeleteError(''); setDeleteTarget(r) }}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {todayRespondents.length === 0 && (
          <div className="text-center py-12 text-white/20">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No entries yet today</p>
            <p className="text-xs mt-1">Tap Add New Entry to start</p>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div><div className="font-bold text-white">Delete Entry?</div><div className="text-white/40 text-sm">This cannot be undone</div></div>
            </div>
            <p className="text-white/60 text-sm mb-4">Remove <strong className="text-white">{deleteTarget.name}</strong> and all their answers?</p>
            {deleteError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">⚠️ {deleteError}</div>}
            <div className="flex gap-3">
              <button type="button" onClick={() => { setDeleteTarget(null); setDeleteError('') }} disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-semibold text-sm disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 active:bg-red-500 text-white font-semibold text-sm disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {showPwModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-white/10 p-6 text-white">
            <h2 className="text-lg font-bold mb-1">Change Password</h2>
            <p className="text-white/40 text-sm mb-5">Enter your current password, then choose a new one.</p>
            {pwSuccess ? (
              <div className="text-center py-6"><div className="text-4xl mb-2">✅</div><p className="text-green-400 font-semibold">Password updated!</p></div>
            ) : (
              <div className="space-y-3">
                <input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder="Current password"
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 outline-none focus:border-blue-500 text-sm" />
                <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="New password (min 4 chars)"
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 outline-none focus:border-blue-500 text-sm" />
                <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Confirm new password"
                  onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 outline-none focus:border-blue-500 text-sm" />
                {pwError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{pwError}</p>}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowPwModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm">Cancel</button>
                  <button type="button" onClick={handleChangePassword} disabled={pwLoading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-50">
                    {pwLoading ? 'Saving…' : 'Update Password'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // ── TYPE CHOICE ──
  if (view === 'type-choice') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}>
        <button type="button" onClick={() => setView('list')} className="flex items-center gap-1.5 text-white/40 active:text-white/70 mb-8 -ml-1">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold mb-1">New Entry</h1>
        <p className="text-white/40 text-sm mb-8">What type of survey are you running?</p>
        <div className="space-y-4">
          <button type="button" onClick={() => { setSurveyChoice('individual'); setView('personal-info') }}
            className="w-full flex items-center gap-4 p-5 bg-blue-500/10 border border-blue-500/25 hover:border-blue-500/50 active:bg-blue-500/20 rounded-2xl transition-all text-left">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-base">Individual / Public</div>
              <div className="text-white/40 text-sm mt-0.5">Survey a person — name, age, gender, location</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
          </button>
          <button type="button" onClick={() => { setSurveyChoice('business'); setView('business-info') }}
            className="w-full flex items-center gap-4 p-5 bg-purple-500/10 border border-purple-500/25 hover:border-purple-500/50 active:bg-purple-500/20 rounded-2xl transition-all text-left">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-base">Business / B2B</div>
              <div className="text-white/40 text-sm mt-0.5">Survey a business — company name, contact, location</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  )

  // ── PERSONAL INFO ──
  if (view === 'personal-info') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pb-32" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}>
          <button type="button" onClick={() => { setView(editingRespondent ? 'list' : 'type-choice'); setEditingRespondent(null) }}
            className="flex items-center gap-1.5 text-white/40 active:text-white/70 mb-6 -ml-1">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
          </button>
          <h1 className="text-2xl font-bold mb-1">{editingRespondent ? 'Edit Person' : 'New Person'}</h1>
          <p className="text-white/40 text-sm mb-6">{editingRespondent ? 'Update their information' : 'Fill in the details before starting the survey'}</p>
          <div className="space-y-4">
            {infoError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{infoError}</div>}
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Full Name *</label>
              <input value={personalInfo.name} onChange={e => { setPersonalInfo(p => ({ ...p, name: e.target.value })); setInfoError('') }}
                placeholder="e.g. Ahmed Bensaid"
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-blue-500 transition-colors text-base" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Age *</label>
                <input type="number" inputMode="numeric" value={personalInfo.age}
                  onChange={e => { setPersonalInfo(p => ({ ...p, age: e.target.value })); setInfoError('') }}
                  placeholder="25" min="1" max="120"
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-blue-500 transition-colors text-base" />
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Gender *</label>
                <select value={personalInfo.gender} onChange={e => { setPersonalInfo(p => ({ ...p, gender: e.target.value })); setInfoError('') }}
                  className="w-full p-4 rounded-xl bg-slate-800 border border-white/10 text-white outline-none focus:border-blue-500 cursor-pointer text-base h-[56px]">
                  <option value="" className="bg-slate-800">Select…</option>
                  {GENDERS.map(g => <option key={g} value={g} className="bg-slate-800">{g}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Location / Neighborhood *</label>
              <input value={personalInfo.location} onChange={e => { setPersonalInfo(p => ({ ...p, location: e.target.value })); setInfoError('') }}
                placeholder="e.g. Maarif, Casablanca"
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-blue-500 transition-colors text-base" />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Phone <span className="text-white/25">(optional)</span></label>
              <input type="tel" inputMode="tel" value={personalInfo.phone} onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. 0612345678"
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-blue-500 transition-colors text-base" />
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-6 pb-safe">
        <div className="px-4 pb-4 max-w-lg mx-auto">
          <button type="button" onClick={handlePersonalInfoSubmit}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 active:opacity-90 rounded-2xl font-bold text-base transition-all active:scale-[0.98]">
            {editingRespondent ? <><CheckCircle className="w-5 h-5" /> Save Changes</> : <>Start Survey <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  )

  // ── BUSINESS INFO ──
  if (view === 'business-info') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pb-32" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}>
          <button type="button" onClick={() => setView('type-choice')} className="flex items-center gap-1.5 text-white/40 active:text-white/70 mb-6 -ml-1">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-purple-400" />
            <h1 className="text-2xl font-bold">Business Info</h1>
          </div>
          <p className="text-white/40 text-sm mb-6">Fill in the business details before starting the survey</p>
          <div className="space-y-4">
            {businessError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{businessError}</div>}
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Business Name *</label>
              <input value={businessInfo.business_name} onChange={e => { setBusinessInfo(p => ({ ...p, business_name: e.target.value })); setBusinessError('') }}
                placeholder="e.g. Café Central"
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-purple-500 transition-colors text-base" />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Contact Person <span className="text-white/25">(optional)</span></label>
              <input value={businessInfo.contact_name} onChange={e => setBusinessInfo(p => ({ ...p, contact_name: e.target.value }))}
                placeholder="e.g. Mohammed Alaoui"
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-purple-500 transition-colors text-base" />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Location / Neighborhood *</label>
              <input value={businessInfo.location} onChange={e => { setBusinessInfo(p => ({ ...p, location: e.target.value })); setBusinessError('') }}
                placeholder="e.g. Gauthier, Casablanca"
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-purple-500 transition-colors text-base" />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Phone <span className="text-white/25">(optional)</span></label>
              <input type="tel" inputMode="tel" value={businessInfo.phone} onChange={e => setBusinessInfo(p => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. 0522345678"
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-purple-500 transition-colors text-base" />
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-6 pb-safe">
        <div className="px-4 pb-4 max-w-lg mx-auto">
          <button type="button" onClick={handleBusinessInfoSubmit}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-pink-600 active:opacity-90 rounded-2xl font-bold text-base transition-all active:scale-[0.98]">
            Start Business Survey <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  // ── SURVEY ──
  const isBiz = surveyChoice === 'business'
  const bgVia = isBiz ? 'via-purple-950' : 'via-blue-950'
  const barGrad = isBiz ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-cyan-500'
  const dotActive = isBiz ? 'bg-purple-500' : 'bg-blue-500'
  const dotDone = isBiz ? 'bg-purple-400' : 'bg-blue-400'
  const reqDot = isBiz ? 'text-purple-400' : 'text-blue-400'
  const btnEnabled = isBiz ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'

  if (view === 'survey') return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 ${bgVia} to-slate-950 text-white flex flex-col`}>
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <motion.div className={`h-full bg-gradient-to-r ${barGrad}`} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
      </div>
      <div className="px-4 pb-2 max-w-lg w-full mx-auto flex items-center justify-between" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}>
        <div className="flex items-center gap-1.5 text-sm text-white/50 font-medium">
          {isBiz && <Building2 className="w-3.5 h-3.5 text-purple-400" />}
          {isBiz ? businessInfo.business_name : personalInfo.name}
        </div>
        <div className="text-xs text-white/40 font-medium">{currentIndex + 1}/{activeQuestions.length}</div>
      </div>
      <div className="flex justify-center gap-1.5 px-4 pb-4 max-w-lg mx-auto w-full">
        {activeQuestions.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
            i < currentIndex ? `${dotDone} flex-1` : i === currentIndex ? `${dotActive} w-6 flex-shrink-0` : 'bg-white/20 flex-1'
          }`} />
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key={currentQuestion?.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              {currentQuestion && (
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 mb-4">
                  <h2 className="text-xl font-bold text-white mb-2 leading-snug">
                    {currentQuestion.title}
                    {currentQuestion.required && <span className={`${reqDot} ml-1`}>*</span>}
                  </h2>
                  {currentQuestion.description && <p className="text-white/50 text-sm mb-5 leading-relaxed">{currentQuestion.description}</p>}
                  {!currentQuestion.description && <div className="mb-5" />}
                  <QuestionRenderer
                    question={currentQuestion}
                    value={answers[currentQuestion.id] ?? ''}
                    onChange={v => setAnswers(prev => ({ ...prev, [currentQuestion.id]: v }))}
                    accentColor={isBiz ? 'purple' : 'blue'}
                  />
                </div>
              )}
              {currentQuestion?.required && !canProceed && <p className="text-yellow-400/70 text-xs text-center mb-2">Answer required to continue</p>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-6 pb-safe">
        <div className="px-4 pb-4 max-w-lg mx-auto flex gap-3">
          {currentIndex > 0 && (
            <button type="button" onClick={() => setCurrentIndex(i => i - 1)}
              className="flex items-center justify-center px-5 py-4 rounded-2xl border border-white/20 active:bg-white/10 transition-all min-h-[52px] w-14 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <button type="button"
            onClick={() => { if (!canProceed) return; if (isLast) handleSurveySubmit(); else setCurrentIndex(i => i + 1) }}
            disabled={!canProceed || submitting}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all min-h-[52px] active:opacity-90 active:scale-[0.98] ${
              canProceed ? btnEnabled : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}>
            {isLast ? <><CheckCircle className="w-5 h-5" /> {submitting ? 'Submitting…' : 'Submit'}</> : <>Next <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  )

  // ── SUCCESS ──
  const successName = isBiz ? businessInfo.business_name : personalInfo.name
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 ${bgVia} to-slate-950 flex items-center justify-center p-5`}>
      <motion.div className="text-center max-w-sm w-full" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2">Submitted! ✅</h2>
        <p className="text-white/50 mb-8 text-sm">
          {isBiz ? `${successName}'s business survey has been saved.` : `${successName}'s responses have been saved successfully.`}
        </p>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => { setPersonalInfo(emptyInfo); setBusinessInfo(emptyBusiness); setView('type-choice') }}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r ${isBiz ? 'from-purple-600 to-pink-600' : 'from-blue-600 to-cyan-600'} rounded-2xl font-bold text-base active:opacity-80 transition-all`}>
            <Plus className="w-5 h-5" /> Add Another Entry
          </button>
          <button type="button" onClick={() => setView('list')}
            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-semibold text-base active:opacity-80 transition-all">
            Back to List
          </button>
        </div>
      </motion.div>
    </div>
  )
}
