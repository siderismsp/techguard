import { useState, useEffect } from 'react'
import { api } from '../lib/api'

const PROFILE_COLORS = {
  kids: { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.25)' },
  adult: { bg: 'rgba(45,212,191,0.1)', text: '#2dd4bf', border: 'rgba(45,212,191,0.2)' },
  iot: { bg: 'rgba(139,145,168,0.1)', text: '#8b91a8', border: 'rgba(139,145,168,0.2)' },
  default: { bg: 'rgba(108,138,255,0.1)', text: '#6c8aff', border: 'rgba(108,138,255,0.2)' },
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newId, setNewId] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadProfiles() }, [])

  async function loadProfiles() {
    try {
      const p = await api.getProfiles()
      setProfiles(p)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function createProfile() {
    if (!newName.trim() || !newId.trim()) return
    setSaving(true)
    try {
      await api.createProfile({ id: newId.trim().toLowerCase().replace(/\s+/g, '_'), name: newName.trim() })
      setShowNew(false)
      setNewName('')
      setNewId('')
      await loadProfiles()
    } catch (e) {
      alert('Failed to create profile: ' + e.message)
    }
    setSaving(false)
  }

  async function deleteProfile(id) {
    if (!confirm('Delete this profile? Devices assigned to it will lose their profile.')) return
    try {
      await api.deleteProfile(id)
      await loadProfiles()
    } catch (e) {
      alert('Failed to delete: ' + e.message)
    }
  }

  async function renameProfile(id) {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await api.updateProfile(id, { name: editName.trim() })
      setEditingId(null)
      await loadProfiles()
    } catch (e) {
      alert('Failed to rename: ' + e.message)
    }
    setSaving(false)
  }

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Loading\u2026</div>

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>Profiles</h1>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Group devices into profiles for scheduling and parental controls
            </p>
          </div>
          <button onClick={() => setShowNew(true)} style={{
            background: 'var(--accent-dim)', border: '0.5px solid var(--accent)',
            borderRadius: 'var(--radius-sm)', padding: '7px 14px',
            color: 'var(--accent)', fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <i className="ti ti-plus" style={{ fontSize: 14 }} /> New Profile
          </button>
        </div>

        {/* New profile form */}
        {showNew && (
          <div style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border-focus)',
            borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 16,
            display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profile Name</span>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Kids, Teens, Guests"
                style={inputStyle} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profile ID</span>
              <input value={newId} onChange={e => setNewId(e.target.value)}
                placeholder="e.g. kids, teens, guests"
                style={inputStyle} />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowNew(false); setNewName(''); setNewId('') }} style={btnSecondary}>Cancel</button>
              <button onClick={createProfile} disabled={saving || !newName.trim() || !newId.trim()} style={btnPrimary}>
                {saving ? 'Creating\u2026' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {/* Profile list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {profiles.map(p => {
            const colors = PROFILE_COLORS[p.id] || PROFILE_COLORS.default
            const editing = editingId === p.id
            return (
              <div key={p.id} style={{
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: colors.bg, border: `0.5px solid ${colors.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 500, color: colors.text, flexShrink: 0
                }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editing ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        style={{ ...inputStyle, flex: 1 }} autoFocus />
                      <button onClick={() => renameProfile(p.id)} disabled={saving} style={btnPrimary}>Save</button>
                      <button onClick={() => setEditingId(null)} style={btnSecondary}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--mono)' }}>{p.id}</div>
                    </>
                  )}
                </div>
                {!editing && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditingId(p.id); setEditName(p.name) }} style={iconBtn} title="Rename">
                      <i className="ti ti-edit" style={{ fontSize: 14 }} />
                    </button>
                    {p.id !== 'default' && (
                      <button onClick={() => deleteProfile(p.id)} style={{ ...iconBtn, color: 'var(--red)' }} title="Delete">
                        <i className="ti ti-trash" style={{ fontSize: 14 }} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
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

const iconBtn = {
  background: 'none', border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '5px 7px',
  color: 'var(--text-secondary)', cursor: 'pointer',
  display: 'flex', alignItems: 'center'
}