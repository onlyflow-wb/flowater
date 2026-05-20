'use client'

import { SurveyProvider, useSurvey } from '@/contexts/SurveyContext'
import { QuestionRenderer } from '@/components/surveys/QuestionRenderer'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle, Building2, Home } from 'lucide-react'
import Link from 'next/link'

function SurveyContent() {
  const {
    currentQuestion, currentIndex, answers, isLoading, isCompleted,
    answerQuestion, nextQuestion, previousQuestion, progress, questions, canProceed,
  } = useSurvey()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          <p className="text-white/50 text-sm">Loading survey...</p>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-5">
        <motion.div
          className="text-center max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">Thank You, Partner! 🏢</h2>
          <p className="text-white/60 mb-8 leading-relaxed text-sm md:text-base px-2">
            Your business interest has been recorded. Our team will reach out soon to
            discuss sponsorship opportunities.
          </p>
          <Link href="/">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-white active:opacity-80 transition-all text-base w-full justify-center">
              <Home className="w-5 h-5" /> Back to Home
            </button>
          </Link>
        </motion.div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-5">
        <div className="text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold text-white mb-3">Survey Coming Soon</h2>
          <p className="text-white/50 mb-8 text-sm">Our team is setting up the business survey. Check back soon!</p>
          <Link href="/">
            <button className="px-6 py-4 bg-purple-600 rounded-2xl font-semibold w-full active:opacity-80">← Go Back</button>
          </Link>
        </div>
      </div>
    )
  }

  const isLast = currentIndex === questions.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
        />
      </div>

      {/* Header */}
      <div className="px-5 pb-2 max-w-2xl w-full mx-auto flex items-center justify-between" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}>
        <Link href="/" className="flex items-center gap-1.5 text-white/40 active:text-white/70 transition-colors text-sm p-1 -ml-1">
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1">
          <Building2 className="w-3 h-3 text-purple-400" />
          <span className="text-xs text-purple-300 font-medium">Business Survey</span>
        </div>

        <div className="text-xs text-white/40 font-medium">
          {currentIndex + 1}/{questions.length}
        </div>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5 px-5 pb-4 max-w-2xl mx-auto w-full">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i < currentIndex ? 'bg-purple-400 flex-1' :
              i === currentIndex ? 'bg-purple-500 w-6 flex-shrink-0' :
              'bg-white/20 flex-1'
            }`}
          />
        ))}
      </div>

      {/* Question area */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <div className="max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion?.id}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {currentQuestion && (
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 md:p-8 mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-snug">
                    {currentQuestion.title}
                    {currentQuestion.required && <span className="text-purple-400 ml-1">*</span>}
                  </h2>
                  {currentQuestion.description && (
                    <p className="text-white/50 text-sm mb-5 leading-relaxed">{currentQuestion.description}</p>
                  )}
                  {!currentQuestion.description && <div className="mb-5" />}

                  <QuestionRenderer
                    question={currentQuestion}
                    value={answers[currentQuestion.id] ?? ''}
                    onChange={(v) => answerQuestion(currentQuestion.id, v)}
                    accentColor="purple"
                  />
                </div>
              )}

              {currentQuestion?.required && !canProceed && (
                <p className="text-yellow-400/70 text-xs text-center mb-2">Answer required to continue</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-6 pb-safe">
        <div className="px-5 pb-4 max-w-2xl mx-auto flex gap-3">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={previousQuestion}
              className="flex items-center justify-center px-5 py-4 rounded-2xl border border-white/20 active:bg-white/10 transition-all min-h-[52px] w-14 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={nextQuestion}
            disabled={!canProceed}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all min-h-[52px] ${
              canProceed
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 active:opacity-90 active:scale-[0.98]'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {isLast ? (
              <><CheckCircle className="w-5 h-5" /> Submit</>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function B2BSurveyPage() {
  return (
    <SurveyProvider surveyType="b2b">
      <SurveyContent />
    </SurveyProvider>
  )
}
