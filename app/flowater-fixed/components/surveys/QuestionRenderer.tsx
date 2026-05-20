'use client'

import { Question } from '@/types'

type AnswerValue = string | string[] | number

interface Props {
  question: Question
  value: AnswerValue
  onChange: (value: AnswerValue) => void
  accentColor?: string
}

export function QuestionRenderer({ question, value, onChange, accentColor = 'blue' }: Props) {
  const isBlue = accentColor !== 'purple'

  const selectedCls = isBlue
    ? 'bg-blue-500/20 border-blue-500 text-white'
    : 'bg-purple-500/20 border-purple-500 text-white'

  const dotCls = isBlue ? 'bg-blue-500' : 'bg-purple-500'
  const borderActiveCls = isBlue ? 'border-blue-400' : 'border-purple-400'
  const textActiveCls = isBlue ? 'text-blue-400' : 'text-purple-400'

  switch (question.type) {

    // ── MULTIPLE CHOICE ─────────────────────────────────────────
    case 'multiple_choice': {
      const selected: string[] = Array.isArray(value)
        ? value
        : value ? String(value).split(',').filter(Boolean) : []
      return (
        <div className="space-y-2.5">
          {question.choices?.map((choice, idx) => {
            const checked = selected.includes(choice)
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const next = checked
                    ? selected.filter(c => c !== choice)
                    : [...selected, choice]
                  onChange(next)
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] min-h-[56px] ${checked ? selectedCls : 'bg-white/5 border-white/10 active:bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? `${dotCls} border-transparent` : 'border-white/30'}`}>
                  {checked && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm md:text-base font-medium text-left">{choice}</span>
              </button>
            )
          })}
        </div>
      )
    }

    // ── SINGLE CHOICE ───────────────────────────────────────────
    case 'single_choice': {
      const strVal = Array.isArray(value) ? value[0] : String(value ?? '')
      return (
        <div className="space-y-2.5">
          {question.choices?.map((choice, idx) => {
            const isSelected = strVal === choice
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(choice)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] min-h-[56px] ${isSelected ? selectedCls : 'bg-white/5 border-white/10 active:bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? borderActiveCls : 'border-white/30'}`}>
                  {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${dotCls}`} />}
                </div>
                <span className="text-sm md:text-base font-medium text-left">{choice}</span>
              </button>
            )
          })}
        </div>
      )
    }

    // ── YES / NO ─────────────────────────────────────────────────
    case 'yes_no': {
      const strVal = Array.isArray(value) ? value[0] : String(value ?? '')
      return (
        <div className="flex gap-3">
          {[
            { key: 'yes', label: '✓  Yes', sel: 'bg-green-500/25 border-green-400 text-green-200' },
            { key: 'no',  label: '✗  No',  sel: 'bg-red-500/25 border-red-400 text-red-200' },
          ].map(({ key, label, sel }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex-1 py-5 rounded-2xl border-2 font-bold text-base transition-all active:scale-[0.97] ${strVal === key ? sel : 'bg-white/5 border-white/10 active:bg-white/10'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )
    }

    // ── SLIDER ───────────────────────────────────────────────────
    case 'slider': {
      const min = question.min_value ?? 0
      const max = question.max_value ?? 10
      const numVal = typeof value === 'number' ? value : Number(value) || Math.round((min + max) / 2)
      const pct = ((numVal - min) / (max - min)) * 100
      return (
        <div className="space-y-6 py-4 px-1">
          <div className={`text-center text-5xl font-extrabold ${textActiveCls}`}>{numVal}</div>
          <input
            type="range" min={min} max={max} step="1" value={numVal}
            style={{ background: `linear-gradient(to right, ${isBlue ? '#3b82f6' : '#a855f7'} ${pct}%, rgba(255,255,255,0.15) ${pct}%)` }}
            className="w-full"
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <div className="flex justify-between text-xs text-white/40 px-1">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      )
    }

    // ── PERCENTAGE SLIDER ────────────────────────────────────────
    case 'percentage_slider': {
      const numVal = typeof value === 'number' ? value : Number(value) || 50
      return (
        <div className="space-y-6 py-4 px-1">
          <div className={`text-center text-5xl font-extrabold ${textActiveCls}`}>{numVal}%</div>
          <input
            type="range" min="0" max="100" step="1" value={numVal}
            style={{ background: `linear-gradient(to right, ${isBlue ? '#3b82f6' : '#a855f7'} ${numVal}%, rgba(255,255,255,0.15) ${numVal}%)` }}
            className="w-full"
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <div className="flex justify-between text-xs text-white/40 px-1">
            <span>0%</span><span>100%</span>
          </div>
        </div>
      )
    }

    // ── RATING SCALE ─────────────────────────────────────────────
    case 'rating_scale': {
      const max = question.max_value ?? 10
      const numVal = typeof value === 'number' ? value : Number(value) || 0
      const ratings = Array.from({ length: max }, (_, i) => i + 1)
      return (
        <div className="space-y-4">
          {/* Responsive grid: 5 cols on mobile, adjust for larger */}
          <div className={`grid gap-2 ${max <= 5 ? 'grid-cols-5' : max <= 7 ? 'grid-cols-4 xs:grid-cols-7' : 'grid-cols-5 xs:grid-cols-5 sm:grid-cols-10'}`}>
            {ratings.map((rating) => {
              const isSelected = numVal === rating
              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => onChange(rating)}
                  className={`h-10 sm:h-12 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 ${isSelected ? `${selectedCls} scale-105` : 'bg-white/5 border-white/10 active:bg-white/10'}`}
                >
                  {rating}
                </button>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-white/40 px-0.5">
            <span>Not at all</span>
            <span>Absolutely</span>
          </div>
        </div>
      )
    }

    // ── EMOJI REACTIONS ──────────────────────────────────────────
    case 'emoji_reactions': {
      const strVal = Array.isArray(value) ? value[0] : String(value ?? '')
      const emojis = question.choices?.length ? question.choices : ['😡', '😕', '😐', '🙂', '😍']
      return (
        <div className="flex justify-around py-4">
          {emojis.map((emoji, idx) => {
            const isSelected = strVal === emoji
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(emoji)}
                className={`text-4xl transition-all p-3 rounded-2xl border-2 active:scale-95 ${isSelected ? `${borderActiveCls} bg-white/10 scale-125` : 'border-transparent opacity-50 hover:opacity-80'}`}
              >
                {emoji}
              </button>
            )
          })}
        </div>
      )
    }

    // ── DROPDOWN ─────────────────────────────────────────────────
    case 'dropdown': {
      const strVal = Array.isArray(value) ? value[0] : String(value ?? '')
      return (
        <select
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 rounded-2xl bg-white/5 border-2 border-white/10 text-white focus:border-blue-500 outline-none cursor-pointer text-base min-h-[56px]"
        >
          <option value="" className="bg-slate-800">Select an option...</option>
          {question.choices?.map((choice, idx) => (
            <option key={idx} value={choice} className="bg-slate-800">{choice}</option>
          ))}
        </select>
      )
    }

    // ── CARD SELECTION ───────────────────────────────────────────
    case 'card_selection': {
      const strVal = Array.isArray(value) ? value[0] : String(value ?? '')
      const cards = question.choices ?? []
      return (
        <div className={`grid gap-2 sm:gap-3 ${cards.length <= 2 ? 'grid-cols-2' : cards.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {cards.map((card, idx) => {
            const [icon, ...rest] = card.split('|')
            const label = rest.length > 0 ? rest.join('|') : icon
            const displayIcon = rest.length > 0 ? icon : '📌'
            const isSelected = strVal === card
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(card)}
                className={`p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 sm:gap-2 text-center transition-all active:scale-95 min-h-[80px] sm:min-h-[90px] ${isSelected ? selectedCls : 'bg-white/5 border-white/10 active:bg-white/10'}`}
              >
                <span className="text-2xl sm:text-3xl">{displayIcon}</span>
                <span className="text-xs font-semibold leading-tight">{label}</span>
              </button>
            )
          })}
        </div>
      )
    }

    // ── SHORT TEXT ────────────────────────────────────────────────
    case 'short_text': {
      const strVal = Array.isArray(value) ? value.join(', ') : String(value ?? '')
      return (
        <textarea
          value={strVal}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.required ? 'Type your answer here...' : 'Optional — share your thoughts...'}
          className="w-full p-4 rounded-2xl bg-white/5 border-2 border-white/10 text-white focus:border-blue-500 outline-none resize-none placeholder:text-white/30 text-base leading-relaxed"
        />
      )
    }

    default:
      return (
        <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
          Unknown question type: <code>{question.type}</code>
        </div>
      )
  }
}
