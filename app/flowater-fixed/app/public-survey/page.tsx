'use client'

import { useState } from 'react'
import { SurveyProvider, useSurvey } from '@/contexts/SurveyContext'
import { QuestionRenderer } from '@/components/surveys/QuestionRenderer'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle, Droplet, Home } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// Polyfill: crypto.randomUUID() is undefined on older Android browsers
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

type Step = 'personal-info' | 'survey'
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say']

interface PersonalInfo {
  name: string
  age: string
  gender: string
}

function PersonalInfoForm({ onContinue }: { onContinue: (info: PersonalInfo, sessionId: string) => void }) {
  const [info, setInfo] = useState<PersonalInfo>({ name: '', age: '', gender: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!info.name.trim()) { setError('Please enter your name.'); return }
    if (!info.age || isNaN(Number(info.age)) || Number(info.age) < 1 || Number(info.age) > 120) {
      setError('Please enter a valid age.'); return
    }
    if (!info.gender) { setError('Please select your gender.'); return }

    setSaving(true)
    const sessionId = generateUUID()
    await supabase.from('respondents').insert({
      name: info.name.trim(),
      age: Number(info.age),
      gender: info.gender,
      survey_type: 'public',
      session_id: sessionId,
    })
    setSaving(false)
    onContinue(info, sessionId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 pb-32" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}>
          <Link href="/" className="flex items-center gap-1.5 text-white/40 active:text-white/70 mb-8 -ml-1">
            <Home className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </Link>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Droplet className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">FloWater</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">Before we begin</h1>
          <p className="text-white/40 text-sm mb-8">We need a few details to contextualise your response. All answers are anonymous.</p>

          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm text-white/50 mb-1.5">Your Name *</label>
              <input
                value={info.name}
                onChange={e => { setInfo(p => ({ ...p, name: e.target.value })); setError('') }}
                placeholder="First name is fine"
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-blue-500 transition-colors text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Age *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={info.age}
                  onChange={e => { setInfo(p => ({ ...p, age: e.target.value })); setError('') }}
                  placeholder="e.g. 28"
                  min="1" max="120"
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-blue-500 transition-colors text-base"
                />
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Gender *</label>
                <select
                  value={info.gender}
                  onChange={e => { setInfo(p => ({ ...p, gender: e.target.value })); setError('') }}
                  className="w-full p-4 rounded-xl bg-slate-800 border border-white/10 text-white outline-none focus:border-blue-500 transition-colors cursor-pointer text-base h-[56px]"
                >
                  <option value="" className="bg-slate-800">Select…</option>
                  {GENDERS.map(g => <option key={g} value={g} className="bg-slate-800">{g}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-6 pb-safe">
        <div className="px-5 pb-4 max-w-lg mx-auto">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 active:opacity-90 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? 'Please wait…' : <>Start Survey <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  )
}

function SurveyContent({ sessionId }: { sessionId: string }) {
  const {
    currentQuestion, currentIndex, answers, isLoading, isCompleted,
    answerQuestion, nextQuestion, previousQuestion, progress, questions, canProceed,
  } = useSurvey()

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        <p className="text-white/50 text-sm">Loading survey...</p>
      </div>
    </div>
  )

  if (isCompleted) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-5">
      <motion.div className="text-center max-w-sm w-full" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-3">Thank You! 💧</h2>
        <p className="text-white/60 mb-8 leading-relaxed text-sm px-2">
          Your response has been recorded anonymously. Together, we're building the data for free clean water everywhere.
        </p>
        <Link href="/">
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl font-bold text-white active:opacity-80 transition-all text-base w-full justify-center">
            <Home className="w-5 h-5" /> Back to Home
          </button>
        </Link>
      </motion.div>
    </div>
  )

  if (questions.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-5">
      <div className="text-center max-w-sm w-full">
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-white mb-3">Survey Coming Soon</h2>
        <p className="text-white/50 mb-8 text-sm">Our team is setting up this survey. Check back soon!</p>
        <Link href="/"><button className="px-6 py-4 bg-blue-600 rounded-2xl font-semibold w-full active:opacity-80">← Go Back</button></Link>
      </div>
    </div>
  )

  const isLast = currentIndex === questions.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white flex flex-col">
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <motion.div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
      </div>

      <div className="px-5 pb-2 max-w-2xl w-full mx-auto flex items-center justify-between" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}>
        <Link href="/" className="flex items-center gap-1.5 text-white/40 active:text-white/70 transition-colors text-sm p-1 -ml-1">
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
          <Droplet className="w-3 h-3 text-blue-400" />
          <span className="text-xs text-blue-300 font-medium">Citizen Survey</span>
        </div>
        <div className="text-xs text-white/40 font-medium">{currentIndex + 1}/{questions.length}</div>
      </div>

      <div className="flex justify-center gap-1.5 px-5 pb-4 max-w-2xl mx-auto w-full">
        {questions.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
            i < currentIndex ? 'bg-blue-400 flex-1' : i === currentIndex ? 'bg-blue-500 w-6 flex-shrink-0' : 'bg-white/20 flex-1'
          }`} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <div className="max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key={currentQuestion?.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              {currentQuestion && (
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 md:p-8 mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-snug">
                    {currentQuestion.title}
                    {currentQuestion.required && <span className="text-blue-400 ml-1">*</span>}
                  </h2>
                  {currentQuestion.description && <p className="text-white/50 text-sm mb-5 leading-relaxed">{currentQuestion.description}</p>}
                  {!currentQuestion.description && <div className="mb-5" />}
                  <QuestionRenderer question={currentQuestion} value={answers[currentQuestion.id] ?? ''} onChange={v => answerQuestion(currentQuestion.id, v)} accentColor="blue" />
                </div>
              )}
              {currentQuestion?.required && !canProceed && (
                <p className="text-yellow-400/70 text-xs text-center mb-2">Answer required to continue</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-6 pb-safe">
        <div className="px-5 pb-4 max-w-2xl mx-auto flex gap-3">
          {currentIndex > 0 && (
            <button type="button" onClick={previousQuestion} className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-white/20 active:bg-white/10 transition-all min-h-[52px] w-14 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <button type="button" onClick={nextQuestion} disabled={!canProceed}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all min-h-[52px] ${canProceed ? 'bg-gradient-to-r from-blue-600 to-cyan-600 active:opacity-90 active:scale-[0.98]' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
            {isLast ? <><CheckCircle className="w-5 h-5" /> Submit</> : <>Next <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PublicSurveyPage() {
  const [step, setStep] = useState<Step>('personal-info')
  const [surveySessionId, setSurveySessionId] = useState('')

  if (step === 'personal-info') {
    return <PersonalInfoForm onContinue={(_, sid) => { setSurveySessionId(sid); setStep('survey') }} />
  }

  return (
    <SurveyProvider surveyType="public" sessionId={surveySessionId}>
      <SurveyContent sessionId={surveySessionId} />
    </SurveyProvider>
  )
}
