'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Question } from '@/types'

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

type AnswerValue = string | string[] | number

interface SurveyContextType {
  questions: Question[]
  currentQuestion: Question | null
  currentIndex: number
  answers: Record<string, AnswerValue>
  isLoading: boolean
  isCompleted: boolean
  answerQuestion: (questionId: string, value: AnswerValue) => void
  nextQuestion: () => void
  previousQuestion: () => void
  submitSurvey: () => Promise<void>
  resetSurvey: () => void
  progress: number
  canProceed: boolean
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined)

export function SurveyProvider({
  children,
  surveyType,
  sessionId: externalSessionId,
}: {
  children: ReactNode
  surveyType: 'public' | 'b2b'
  sessionId?: string
}) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Use provided sessionId (from personal-info step) or generate a new one
  const [sessionId] = useState(() => externalSessionId ?? generateUUID())

  useEffect(() => {
    loadQuestions()
  }, [surveyType])

  async function loadQuestions() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_type', surveyType)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (!error && data) setQuestions(data)
    setIsLoading(false)
  }

  const currentQuestion = questions[currentIndex] ?? null
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0

  const canProceed = (() => {
    if (!currentQuestion) return true
    if (!currentQuestion.required) return true
    const ans = answers[currentQuestion.id]
    if (ans === undefined || ans === null) return false
    if (typeof ans === 'string') return ans.trim() !== ''
    if (Array.isArray(ans)) return ans.length > 0
    if (typeof ans === 'number') return true
    return false
  })()

  function answerQuestion(questionId: string, value: AnswerValue) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  function nextQuestion() {
    if (!canProceed || isSubmitting) return
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      submitSurvey()
    }
  }

  function previousQuestion() {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
  }

  async function submitSurvey() {
    if (isSubmitting) return
    setIsSubmitting(true)

    const responses = Object.entries(answers).map(([questionId, answerValue]) => ({
      session_id: sessionId,
      question_id: questionId,
      answer_value: Array.isArray(answerValue) ? answerValue.join(',') : String(answerValue),
      survey_type: surveyType,
    }))

    if (responses.length > 0) {
      const { error } = await supabase.from('responses').insert(responses)
      if (error) {
        console.error('Failed to save responses:', error.message)
      }
    }

    setIsCompleted(true)
    setIsSubmitting(false)
  }

  function resetSurvey() {
    setAnswers({})
    setCurrentIndex(0)
    setIsCompleted(false)
    setIsSubmitting(false)
  }

  return (
    <SurveyContext.Provider value={{
      questions, currentQuestion, currentIndex, answers,
      isLoading, isCompleted, answerQuestion, nextQuestion,
      previousQuestion, submitSurvey, resetSurvey, progress, canProceed,
    }}>
      {children}
    </SurveyContext.Provider>
  )
}

export function useSurvey() {
  const context = useContext(SurveyContext)
  if (!context) throw new Error('useSurvey must be used within SurveyProvider')
  return context
}
