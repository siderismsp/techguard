import { useState } from 'react'
import { api } from '../lib/api'

const PROFILE_COLORS = {
  kids: { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.25)' },
  adult: { bg: 'rgba(45,212,191,0.1)', text: '#2dd4bf', border: 'rgba(45,212,191,0.2)' },
  iot: { bg: 'rgba(139,145,168,0.1)', text: '#8b91a8', border: 'rgba(139,145,168,0.2)' },
  default: { bg: 'rgba(108,138,255,0.1)', text: '#6c8aff', border: 'rgba(108,138,255,0.2)' },
}

function initials(name) {
  return name.split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase() || '??'
}

export default function DeviceCard({ device, profiles, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: device.name,
    static_ip: device.static_ip || '',
    profile: device.profile,
    notes: device.notes || ''
  })
  const [saving, setSaving] = useState(false)

  const colors = PROFILE_COLORS[device.profile] || PROFILE_COLORS.default
  const isRestricted = !device.hasAccess

  async function save() {
    setSaving(true)
    try {
      const updated = await api.updateDevice(device.mac, {
        name: form.name,
        static_ip: form.static_ip || null,
        profile: form.profile,
        notes: form.notes
      })
      onUpdate(updated)
      setEditing(false)
    } catch (e) {
      alert('Save failed: ' + e.message)
    }
    setSaving(false)
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: isRestricted ? '0.5px solid rgba(248,113,113,0.25)' : '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = isRestricted ? 'rgba(248,113,113,0.4)' : 'var(--border-focus)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isRestricted ? '0.5px solid rgba(248,113,113,0.25)' : 'var(--border)'}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: editing ? 14 : 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: isRestricted ? 'var(--red-dim)' : colors.bg,
          border: isRestricted ? '0.5px solid rgba(248,113,113,0.2)' : `0.5px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 500, color: isRestricted ? 'var(--red)' : colors.text,
          flexShrink: 0
        }}>
          {initials(device.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {device.name}
            {isRestricted && (
              <span style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 20,
                background: 'var(--red-dim)', color: 'var(--red)',
                border: '0.5px solid rgba(248,113,113,0.2)'
              }}>restricted</span>
            )}
            {device.restriction && (
              <span style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 20,
                background: 'var(--amber-dim)', color: 'var(--amber)',
                border: '0.5px solid rgba(251,191,36,0.2)',
                fontFamily: 'var(--mono)',
                maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }} title={device.restriction}>
                {device.restriction}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--mono)', marginTop: 1 }}>
            {device.ip || '\u2014'} \u00b7 {device.mac}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 20,
            background: colors.bg, color: colors.text, border: `0.5px solid ${colors.border}`
          }}>
            {device.profile}
          </span>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: device.online ? 'var(--green)' : 'var(--text-tertiary)',
            flexShrink: 0
          }} title={device.online ? 'Online' : 'Offline'} />
          <button onClick={() => setEditing(!editing)} style={{
            background: 'none', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '4px 8px',
            color: 'var(--text-secondary)', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            <i className={`ti ${editing ? 'ti-x' : 'ti-edit'}`} style={{ fontSize: 13 }} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 4 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</span>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Static IP</span>
            <input value={form.static_ip} onChange={e => setForm(f => ({ ...f, static_ip: e.target.value }))}
              placeholder="leave blank for dynamic" style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profile</span>
            <select value={form.profile} onChange={e => setForm(f => ({ ...f, profile: e.target.value }))}
              style={inputStyle}>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes</span>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="optional note..." style={inputStyle} />
          </label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} style={btnSecondary}>Cancel</button>
            <button onClick={save} disabled={saving} style={btnPrimary}>
              {saving ? 'Saving\u2026' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  background: 'var(--bg-input)', border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '6px 10px',
  color: 'var(--text)', fontSize: 13, width: '100%',
  outline: 'none'
}

const btnPrimary = {
  background: 'var(--accent-dim)', border: '0.5px solid var(--accent)',
  borderRadius: 'var(--radius-sm)', padding: '6px 14px',
  color: 'var(--accent)', fontSize: 13, cursor: 'pointer'
}

const btnSecondary = {
  background: 'none', border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '6px 14px',
  color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer'
}