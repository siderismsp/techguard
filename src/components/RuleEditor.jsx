import { useState } from 'react'
import { api } from '../lib/api'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function RuleEditor({ profileId, rule, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState({
    name: rule?.name || 'New rule',
    days: rule?.days || [1, 2, 3, 4, 5],
    access_start: rule?.access_start || '07:00',
    access_end: rule?.access_end || '21:00',
    enabled: rule?.enabled !== undefined ? !!rule.enabled : true,
  })
  const [saving, setSaving] = useState(false)

  function toggleDay(d) {
    setForm(f => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d].sort()
    }))
  }

  async function save() {
    setSaving(true)
    try {
      let saved
      if (rule?.id) {
        saved = await api.updateRule(rule.id, form)
      } else {
        saved = await api.createRule(profileId, { ...form, priority: 10 })
      }
      onSave(saved)
    } catch (e) {
      alert('Save failed: ' + e.message)
    }
    setSaving(false)
  }

  async function remove() {
    if (!rule?.id || !confirm('Delete this rule?')) return
    await api.deleteRule(rule.id)
    onDelete(rule.id)
  }

  // Preview bar
  const previewSlots = Array.from({ length: 24 }, (_, h) => {
    const t = `${String(h).padStart(2, '0')}:00`
    if (!form.access_start || !form.access_end) return 'off'
    return t >= form.access_start && t < form.access_end ? 'on' : 'off'
  })

  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border-focus)',
      borderRadius: 'var(--radius-lg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          style={{
            flex: 1, background: 'var(--bg-input)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--text)', fontSize: 14, fontWeight: 500
          }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <Toggle checked={form.enabled} onChange={v => setForm(f => ({ ...f, enabled: v })) } />
          <span style={{ fontSize: 12, color: form.enabled ? 'var(--green)' : 'var(--text-tertiary)' }}>
            {form.enabled ? 'Active' : 'Paused'}
          </span>
        </label>
      </div>

      {/* Day selector */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Active days
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {DAYS.map((d, i) => (
            <button key={i} onClick={() => toggleDay(i)} style={{
              width: 36, height: 36, borderRadius: 8,
              background: form.days.includes(i) ? 'var(--accent-dim)' : 'var(--bg-input)',
              border: `0.5px solid ${form.days.includes(i) ? 'var(--accent)' : 'var(--border)'}`,
              color: form.days.includes(i) ? 'var(--accent)' : 'var(--text-tertiary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer'
            }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Time range */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Access window
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="time" value={form.access_start}
            onChange={e => setForm(f => ({ ...f, access_start: e.target.value }))}
            style={timeInput} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>to</span>
          <input type="time" value={form.access_end}
            onChange={e => setForm(f => ({ ...f, access_end: e.target.value }))}
            style={timeInput} />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 4 }}>
            (internet off outside this window)
          </span>
        </div>
      </div>

      {/* 24h preview bar */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Day preview
        </div>
        <div style={{ display: 'flex', gap: 2, height: 14, borderRadius: 4, overflow: 'hidden' }}>
          {previewSlots.map((s, i) => (
            <div key={i} style={{
              flex: 1,
              background: s === 'on' ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.25)'
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          {['12a', '6a', '12p', '6p', '12a'].map((l, i) => (
            <span key={i} style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{l}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {rule?.id && (
          <button onClick={remove} style={{
            background: 'none', border: '0.5px solid rgba(248,113,113,0.3)',
            borderRadius: 'var(--radius-sm)', padding: '6px 12px',
            color: 'var(--red)', fontSize: 12, cursor: 'pointer', marginRight: 'auto'
          }}>Delete</button>
        )}
        <button onClick={onCancel} style={{
          background: 'none', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '6px 14px',
          color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer'
        }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{
          background: 'var(--accent-dim)', border: '0.5px solid var(--accent)',
          borderRadius: 'var(--radius-sm)', padding: '6px 14px',
          color: 'var(--accent)', fontSize: 13, cursor: 'pointer'
        }}>
          {saving ? 'Saving\u2026' : 'Save rule'}
        </button>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 32, height: 18, borderRadius: 18, cursor: 'pointer',
      background: checked ? 'var(--green)' : 'var(--text-tertiary)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0
    }}>
      <div style={{
        position: 'absolute', width: 12, height: 12, borderRadius: '50%',
        background: 'white', top: 3,
        left: checked ? 17 : 3, transition: 'left 0.2s'
      }} />
    </div>
  )
}

const timeInput = {
  background: 'var(--bg-input)', border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '6px 10px',
  color: 'var(--text)', fontSize: 13, fontFamily: 'var(--mono)',
  outline: 'none'
}