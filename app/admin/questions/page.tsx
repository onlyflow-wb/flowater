'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff, AlertTriangle, X } from 'lucide-react'
import { Reorder } from 'framer-motion'
import { Question, QuestionType } from '@/types'
import { apiFetch, readApiError } from '@/lib/api-client'

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single_choice',     label: 'Single Choice' },
  { value: 'multiple_choice',   label: 'Multiple Choice' },
  { value: 'yes_no',            label: 'Yes / No' },
  { value: 'slider',            label: 'Slider' },
  { value: 'percentage_slider', label: 'Percentage Slider' },
  { value: 'rating_scale',      label: 'Rating Scale (1–10)' },
  { value: 'emoji_reactions',   label: 'Emoji Reactions' },
  { value: 'dropdown',          label: 'Dropdown' },
  { value: 'card_selection',    label: 'Card Selection' },
  { value: 'short_text',        label: 'Short Text' },
]

const NEEDS_CHOICES: QuestionType[] = [
  'single_choice', 'multiple_choice', 'dropdown', 'card_selection', 'emoji_reactions',
]
const HAS_RANGE: QuestionType[] = ['slider', 'rating_scale']

const emptyForm = (surveyType: 'public' | 'b2b'): Partial<Question> => ({
  title: '',
  description: '',
  type: 'single_choice',
  choices: [''],
  required: true,
  is_active: true,
  min_value: 0,
  max_value: 10,
  survey_type: surveyType,
})

export default function QuestionsPage() {
  const [questions, setQuestions]   = useState<Question[]>([])
  const [surveyType, setSurveyType] = useState<'public' | 'b2b'>('public')
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState<Partial<Question>>(emptyForm('public'))
  const [isEditing, setIsEditing]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState('')          // ← replaces alert()
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null) // ← replaces confirm()
  const [deleteError, setDeleteError]   = useState('')
  const [deleting, setDeleting]         = useState(false)

  const loadQuestions = useCallback(async () => {
    const params = new URLSearchParams({ survey_type: surveyType })
    const res = await fetch(`/api/admin/questions?${params}`)
    const data = await res.json().catch(() => null)
    if (res.ok) setQuestions(data?.questions ?? [])
  }, [surveyType])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  function openNew() {
    setForm(emptyForm(surveyType))   // ← always uses current tab
    setFormError('')
    setIsEditing(false)
    setShowModal(true)
  }

  function openEdit(q: Question) {
    setForm({ ...q, choices: q.choices?.length ? [...q.choices] : [''] })
    setFormError('')
    setIsEditing(true)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setFormError('')
    setForm(emptyForm(surveyType))
  }

  function setField<K extends keyof Question>(key: K, value: Question[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // When type changes, reset choices so stale data doesn't corrupt the save
  function handleTypeChange(newType: QuestionType) {
    setField('type', newType)
    if (NEEDS_CHOICES.includes(newType)) {
      setField('choices', [''])
    } else {
      setField('choices', [])
    }
  }

  function setChoiceAt(idx: number, val: string) {
    const next = [...(form.choices ?? [])]
    next[idx] = val
    setField('choices', next)
  }

  function addChoice()           { setField('choices', [...(form.choices ?? []), '']) }
  function removeChoice(idx: number) {
    setField('choices', (form.choices ?? []).filter((_, i) => i !== idx))
  }

  async function handleSave() {
    setFormError('')
    if (!form.title?.trim()) {
      setFormError('Question title is required.')
      return
    }
    if (NEEDS_CHOICES.includes(form.type as QuestionType)) {
      const cleaned = (form.choices ?? []).map(c => c.trim()).filter(Boolean)
      if (cleaned.length < 1) {
        setFormError('Add at least one answer option.')
        return
      }
    }

    setSaving(true)
    const payload = {
      title:       form.title!.trim(),
      description: form.description?.trim() || null,
      type:        form.type as QuestionType,
      choices:     NEEDS_CHOICES.includes(form.type as QuestionType)
        ? (form.choices ?? []).map(c => c.trim()).filter(Boolean)
        : null,
      required:    form.required ?? true,
      is_active:   form.is_active ?? true,
      survey_type: surveyType,               // always use current tab
      order_index: isEditing ? (form.order_index ?? 0) : questions.length,
      min_value:   HAS_RANGE.includes(form.type as QuestionType) ? (form.min_value ?? 0)  : null,
      max_value:   HAS_RANGE.includes(form.type as QuestionType) ? (form.max_value ?? 10) : null,
    }

    if (isEditing && form.id) {
      const res = await apiFetch('/api/admin/questions', {
        method: 'PUT',
        body: JSON.stringify({ id: form.id, ...payload }),
      })
      if (!res.ok) { setFormError('Save failed: ' + await readApiError(res)); setSaving(false); return }
    } else {
      const res = await apiFetch('/api/admin/questions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (!res.ok) { setFormError('Save failed: ' + await readApiError(res)); setSaving(false); return }
    }

    setSaving(false)
    closeModal()
    loadQuestions()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    const params = new URLSearchParams({ id: deleteTarget.id })
    const res = await apiFetch(`/api/admin/questions?${params}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) {
      setDeleteError('Delete failed: ' + await readApiError(res))
      return
    }
    setDeleteTarget(null)
    setDeleteError('')
    loadQuestions()
  }

  async function handleToggleActive(q: Question) {
    const res = await apiFetch('/api/admin/questions', {
      method: 'PATCH',
      body: JSON.stringify({ id: q.id, is_active: !q.is_active }),
    })
    if (!res.ok) return
    setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, is_active: !x.is_active } : x))
  }

  async function handleReorder(newOrder: Question[]) {
    setQuestions(newOrder)
    await Promise.all(newOrder.map((q, i) => apiFetch('/api/admin/questions', {
      method: 'PATCH',
      body: JSON.stringify({ id: q.id, order_index: i }),
    })))
  }

  async function handleDuplicate(q: Question) {
    const payload = {
      title: `${q.title} (Copy)`,
      description: q.description ?? null,
      type: q.type,
      choices: q.choices ?? null,
      required: q.required,
      is_active: q.is_active,
      survey_type: q.survey_type,
      order_index: questions.length,
      min_value: q.min_value ?? null,
      max_value: q.max_value ?? null,
    }
    await apiFetch('/api/admin/questions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    loadQuestions()
  }

  const needsChoices = NEEDS_CHOICES.includes(form.type as QuestionType)
  const hasRange     = HAS_RANGE.includes(form.type as QuestionType)

  // ── Toggle component to avoid click double-fire ──
  function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
    return (
      <div className="flex items-center gap-2 select-none">
        <button
          type="button"
          onClick={onChange}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-blue-600' : 'bg-white/20'}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'left-5' : 'left-1'}`} />
        </button>
        <span className="text-sm text-white/60 cursor-pointer" onClick={onChange}>{label}</span>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Questions</h1>
          <p className="text-white/40 text-xs sm:text-sm mt-1">Drag to reorder · Toggle to activate · Click to edit</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg font-semibold transition-all text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="mb-5 sm:mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
          {(['public', 'b2b'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setSurveyType(t)}
              className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${surveyType === t ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              {t === 'public' ? '💧 Citizen Survey' : '🏢 Business Survey'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {questions.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-white mb-2">No questions yet</h3>
          <p className="text-white/40 mb-6">Create your first question to start collecting responses</p>
          <button type="button" onClick={openNew} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors">
            + Add First Question
          </button>
        </div>
      ) : (
        <Reorder.Group axis="y" values={questions} onReorder={handleReorder} className="space-y-3">
          {questions.map(q => (
            <Reorder.Item key={q.id} value={q}
              className="bg-white/5 hover:bg-white/8 rounded-xl p-4 flex items-center gap-4 border border-white/5 cursor-move select-none">
              <GripVertical className="w-5 h-5 text-white/30 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${!q.is_active ? 'text-white/40' : ''}`}>{q.title}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/50">
                    {QUESTION_TYPES.find(t => t.value === q.type)?.label ?? q.type}
                  </span>
                  {!q.is_active && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400">Inactive</span>
                  )}
                  {q.required && <span className="text-xs text-white/30">Required</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => handleToggleActive(q)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                  {q.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => handleDuplicate(q)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white text-sm">⧉</button>
                <button type="button" onClick={() => openEdit(q)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(q)}
                  className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-white/40 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-slate-900 border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{isEditing ? 'Edit' : 'New'} Question</h2>
              <button type="button" onClick={closeModal}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Inline error */}
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Question Title *</label>
                <input
                  value={form.title ?? ''}
                  onChange={e => { setField('title', e.target.value); setFormError('') }}
                  placeholder="e.g. Would you use free sponsored water stations?"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Description (optional)</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={e => setField('description', e.target.value)}
                  rows={2}
                  placeholder="Optional context or explanation..."
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Question Type</label>
                <select
                  value={form.type ?? 'single_choice'}
                  onChange={e => handleTypeChange(e.target.value as QuestionType)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-white/10 text-white outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  {QUESTION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Range */}
              {hasRange && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-white/50 mb-1.5">Min Value</label>
                    <input type="number" value={form.min_value ?? 0}
                      onChange={e => setField('min_value', Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1.5">Max Value</label>
                    <input type="number" value={form.max_value ?? 10}
                      onChange={e => setField('max_value', Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-colors" />
                  </div>
                </div>
              )}

              {/* Choices */}
              {needsChoices && (
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">
                    Answer Options
                    {form.type === 'card_selection' && <span className="ml-2 text-xs text-white/30">Format: 🎯|Label text</span>}
                    {form.type === 'emoji_reactions' && <span className="ml-2 text-xs text-white/30">Enter emojis as options</span>}
                  </label>
                  <div className="space-y-2">
                    {(form.choices ?? ['']).map((choice, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          value={choice}
                          onChange={e => setChoiceAt(idx, e.target.value)}
                          placeholder={
                            form.type === 'card_selection' ? `🎯|Option ${idx + 1}` :
                            form.type === 'emoji_reactions' ? '😀' :
                            `Option ${idx + 1}`
                          }
                          className="flex-1 p-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/20 outline-none focus:border-blue-500 transition-colors"
                        />
                        {(form.choices ?? []).length > 1 && (
                          <button type="button" onClick={() => removeChoice(idx)}
                            className="p-2.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addChoice}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 mt-1">
                      <Plus className="w-3 h-3" /> Add option
                    </button>
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="flex gap-6 pt-2">
                <Toggle value={!!form.required}   onChange={() => setField('required',  !form.required)}  label="Required" />
                <Toggle value={!!form.is_active}  onChange={() => setField('is_active', !form.is_active)} label="Active"   />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl font-medium transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-semibold transition-all disabled:opacity-50">
                  {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Question?</h3>
            <p className="text-white/50 text-sm mb-4 leading-relaxed">
              <span className="text-white/70">{deleteTarget.title}</span> will be permanently removed and
              all its responses will be orphaned.
            </p>
            {deleteError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-left">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => { setDeleteTarget(null); setDeleteError('') }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl font-medium transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl font-semibold transition-colors text-white disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
