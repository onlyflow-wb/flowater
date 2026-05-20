'use client'

import { useEffect, useState } from 'react'
import { Helper } from '@/types'
import { Plus, Edit2, Trash2, X, AlertTriangle, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react'
import { apiFetch, readApiError } from '@/lib/api-client'

const emptyForm = { username: '', password: '', display_name: '', is_active: true }

export default function HelpersPage() {
  const [helpers, setHelpers] = useState<Helper[]>([])
  const [respondentCounts, setRespondentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Helper | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => { loadHelpers() }, [])

  async function loadHelpers() {
    setLoading(true)
    const helpersRes = await fetch('/api/admin/helpers')
    const helpersData = await helpersRes.json().catch(() => null)
    if (helpersRes.ok) {
      setHelpers(helpersData?.helpers ?? [])
      // Fetch today's respondent count per helper
      try {
        const res = await fetch('/api/admin/data')
        if (res.ok) {
          const { respondents } = await res.json()
          const today = new Date(); today.setHours(0,0,0,0)
          const counts: Record<string, number> = {}
          for (const r of respondents ?? []) {
            if (r.helper_id && new Date(r.created_at) >= today) {
              counts[r.helper_id] = (counts[r.helper_id] ?? 0) + 1
            }
          }
          setRespondentCounts(counts)
        }
      } catch { /* ignore */ }
    }
    setLoading(false)
  }

  function openNew() {
    setForm(emptyForm)
    setEditId(null)
    setIsEditing(false)
    setFormError('')
    setShowPass(false)
    setShowModal(true)
  }

  function openEdit(h: Helper) {
    // Don't pre-fill password — leave blank; only update if admin types a new one
    setForm({ username: h.username, password: '', display_name: h.display_name, is_active: h.is_active })
    setEditId(h.id)
    setIsEditing(true)
    setFormError('')
    setShowPass(false)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setFormError('')
    setForm(emptyForm)
    setEditId(null)
  }

  async function handleSave() {
    setFormError('')
    if (!form.display_name.trim()) { setFormError('Name is required.'); return }
    if (!form.username.trim()) { setFormError('Username is required.'); return }
    if (!isEditing) {
      if (!form.password.trim()) { setFormError('Password is required.'); return }
      if (form.password.length < 4) { setFormError('Password must be at least 4 characters.'); return }
    } else if (form.password.trim() && form.password.length < 4) {
      setFormError('New password must be at least 4 characters.'); return
    }

    setSaving(true)

    // Check username uniqueness (skip current when editing)
    const conflict = helpers.find((helper) => helper.username === form.username.trim().toLowerCase() && helper.id !== editId)
    if (conflict) { setFormError('Username already taken.'); setSaving(false); return }

    const payload: { username: string; display_name: string; is_active: boolean; password?: string } = {
      username: form.username.trim().toLowerCase(),
      display_name: form.display_name.trim(),
      is_active: form.is_active,
    }

    if (form.password.trim()) {
      payload.password = form.password
    }

    if (isEditing && editId) {
      const res = await apiFetch('/api/admin/helpers', {
        method: 'PUT',
        body: JSON.stringify({ id: editId, ...payload }),
      })
      if (!res.ok) {
        setFormError('Save failed: ' + await readApiError(res)); setSaving(false); return
      }
    } else {
      const res = await apiFetch('/api/admin/helpers', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        setFormError('Save failed: ' + await readApiError(res)); setSaving(false); return
      }
    }

    setSaving(false)
    closeModal()
    loadHelpers()
  }

  async function handleToggle(h: Helper) {
    const newValue = !h.is_active
    // Optimistic UI update first
    setHelpers(prev => prev.map(x => x.id === h.id ? { ...x, is_active: newValue } : x))
    try {
      const res = await apiFetch('/api/admin/helpers', {
        method: 'PATCH',
        body: JSON.stringify({ id: h.id, is_active: newValue }),
      })
      if (!res.ok) {
        setHelpers(prev => prev.map(x => x.id === h.id ? { ...x, is_active: h.is_active } : x))
        setFormError(await readApiError(res, 'Failed to update helper status'))
      }
    } catch {
      setHelpers(prev => prev.map(x => x.id === h.id ? { ...x, is_active: h.is_active } : x))
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      const params = new URLSearchParams({ id: deleteTarget.id })
      const res = await apiFetch(`/api/admin/helpers?${params}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setDeleteError(body.error ?? 'Delete failed. Please try again.')
        setDeleting(false)
        return
      }
      const target = deleteTarget
      setDeleteTarget(null)
      setDeleting(false)
      setHelpers(prev => prev.filter(h => h.id !== target.id))
    } catch (e) {
      setDeleteError(String(e))
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Helpers</h1>
          <p className="text-white/40 text-xs sm:text-sm mt-1">Manage field team accounts</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg font-semibold transition-all text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Helper
        </button>
      </div>

      {helpers.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">No helpers yet</h3>
          <p className="text-white/40 mb-6 text-sm">Create accounts for your field team</p>
          <button type="button" onClick={openNew} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors text-sm">
            + Add First Helper
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {helpers.map(h => (
            <div key={h.id} className="bg-white/5 rounded-xl p-4 flex items-center gap-4 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {h.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-semibold ${!h.is_active ? 'text-white/40' : ''}`}>{h.display_name}</span>
                  {!h.is_active && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400">Inactive</span>
                  )}
                  {(respondentCounts[h.id] ?? 0) > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400">
                      {respondentCounts[h.id]} today
                    </span>
                  )}
                </div>
                <div className="text-sm text-white/40 mt-0.5">@{h.username}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => handleToggle(h)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white" title={h.is_active ? 'Deactivate' : 'Activate'}>
                  {h.is_active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button type="button" onClick={() => openEdit(h)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(h)}
                  className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-white/40 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{isEditing ? 'Edit' : 'New'} Helper</h2>
              <button type="button" onClick={closeModal} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm text-white/50 mb-1.5">Full Name *</label>
                <input
                  value={form.display_name}
                  onChange={e => { setForm(p => ({ ...p, display_name: e.target.value })); setFormError('') }}
                  placeholder="e.g. Karim Benali"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-1.5">Username *</label>
                <input
                  value={form.username}
                  onChange={e => { setForm(p => ({ ...p, username: e.target.value.toLowerCase() })); setFormError('') }}
                  placeholder="e.g. karim"
                  autoCapitalize="none"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setFormError('') }}
                    placeholder="Min 4 characters"
                    className="w-full p-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-blue-500 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${form.is_active ? 'bg-blue-600' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'left-5' : 'left-1'}`} />
                </button>
                <span className="text-sm text-white/60">Active account</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl font-medium transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-semibold transition-all disabled:opacity-50">
                  {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Delete Helper?</h3>
            <p className="text-white/50 text-sm mb-4">
              <span className="text-white/70">{deleteTarget.display_name}</span> will lose access permanently.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-left">
                ⚠️ {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => { setDeleteTarget(null); setDeleteError('') }} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl font-medium transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl font-semibold transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
