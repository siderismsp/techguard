import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import RuleEditor from '../components/RuleEditor'
import CalendarOverrides from '../components/CalendarOverrides'

const PROFILE_COLORS = {
  kids: 'var(--purple)',
  adult: 'var(--teal)',
  iot: 'var(--text-secondary)',
  default: 'var(--accent)',
}

export default function SchedulesPage() {
  const [profiles, setProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [rules, setRules] = useState([])
  const [editingRule, setEditingRule] = useState(null)
  const [showNewRule, setShowNewRule] = useState(false)
  const [loading, setLoading] = useState(true)
  const [screenTime, setScreenTime] = useState(null)
  const [usage, setUsage] = useState(null)
  const [showScreenTimeEditor, setShowScreenTimeEditor] = useState(false)
  const [stForm, setStForm] = useState({ daily_minutes: 120, enabled: false, reset_hour: 0 })
  const [stSaving, setStSaving] = useState(false)

  useEffect(() => {
    api.getProfiles().then(p => {
      setProfiles(p)
      if (p.length > 0) setSelectedProfile(p.find(x => x.id === 'kids') || p[0])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (selectedProfile) {
      loadRules()
      loadScreenTime()
    }
  }, [selectedProfile])

  async function loadRules() {
    const r = await api.getRules(selectedProfile.id)
    setRules(r)
  }

  async function loadScreenTime() {
    try {
      const [budget, status] = await Promise.all([
        api.getScreenTimeBudget(selectedProfile.id),
        api.getScreenTimeStatus(selectedProfile.id)
      ])
      setScreenTime(budget)
      setUsage(status)
      setStForm({
        daily_minutes: budget.daily_minutes || 120,
        enabled: budget.enabled || false,
        reset_hour: budget.reset_hour || 0
      })
    } catch {}
  }

  async function saveScreenTime() {
    setStSaving(true)
    try {
      await api.updateScreenTimeBudget(selectedProfile.id, stForm)
      setShowScreenTimeEditor(false)
      loadScreenTime()
    } catch (e) {
      alert('Failed to save: ' + e.message)
    }
    setStSaving(false)
  }

  function onRuleSaved(rule) {
    setRules(prev => {
      const exists = prev.find(r => r.id === rule.id)
      return exists ? prev.map(r => r.id === rule.id ? rule : r) : [...prev, rule]
    })
    setEditingRule(null)
    setShowNewRule(false)
  }

  function onRuleDeleted(id) {
    setRules(prev => prev.filter(r => r.id !== id))
    setEditingRule(null)
  }

  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Loading\u2026</div>

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>Schedules</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Set access windows, screen time budgets, and calendar overrides per profile
          </p>
        </div>

        {/* Profile tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {profiles.map(p => {
            const active = selectedProfile?.id === p.id
            const color = PROFILE_COLORS[p.id] || 'var(--accent)'
            return (
              <button key={p.id} onClick={() => { setSelectedProfile(p); setEditingRule(null); setShowNewRule(false); setShowScreenTimeEditor(false) }}
                style={{
                  padding: '7px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  background: active ? `${color}20` : 'var(--bg-card)',
                  color: active ? color : 'var(--text-secondary)',
                  border: `0.5px solid ${active ? color : 'var(--border)'}`,
                  fontWeight: active ? 500 : 400, transition: 'all 0.15s'
                }}>
                {p.name}
              </button>
            )
          })}
        </div>

        {selectedProfile && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Left column: rules + screen time */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Weekly rules section */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Weekly time windows</span>
                {!showNewRule && (
                  <button onClick={() => setShowNewRule(true)} style={{
                    background: 'none', border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '4px 10px',
                    color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    <i className="ti ti-plus" style={{ fontSize: 13 }} /> Add rule
                  </button>
                )}
              </div>

              {showNewRule && (
                <RuleEditor
                  profileId={selectedProfile.id}
                  onSave={onRuleSaved}
                  onDelete={onRuleDeleted}
                  onCancel={() => setShowNewRule(false)}
                />
              )}

              {rules.length === 0 && !showNewRule && (
                <div style={{
                  padding: 24, textAlign: 'center', color: 'var(--text-tertiary)',
                  fontSize: 13, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                  border: '0.5px solid var(--border)'
                }}>
                  No time windows \u2014 this profile has unrestricted access.
                  <br /><button onClick={() => setShowNewRule(true)} style={{
                    marginTop: 10, background: 'none', border: 'none',
                    color: 'var(--accent)', cursor: 'pointer', fontSize: 13
                  }}>Add your first rule \u2192</button>
                </div>
              )}

              {rules.map(rule => (
                editingRule === rule.id ? (
                  <RuleEditor key={rule.id} profileId={selectedProfile.id} rule={rule}
                    onSave={onRuleSaved} onDelete={onRuleDeleted} onCancel={() => setEditingRule(null)} />
                ) : (
                  <div key={rule.id}
                    onClick={() => setEditingRule(rule.id)}
                    style={{
                      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-lg)', padding: '12px 14px',
                      cursor: 'pointer', transition: 'border-color 0.15s',
                      opacity: rule.enabled ? 1 : 0.5
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{rule.name}</span>
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 20,
                        background: rule.enabled ? 'var(--green-dim)' : 'var(--bg-input)',
                        color: rule.enabled ? 'var(--green)' : 'var(--text-tertiary)'
                      }}>{rule.enabled ? 'active' : 'paused'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                      {DAYS.map((d, i) => (
                        <span key={i} style={{
                          width: 24, height: 24, borderRadius: 6, fontSize: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: rule.days.includes(i) ? 'var(--accent-dim)' : 'var(--bg-input)',
                          color: rule.days.includes(i) ? 'var(--accent)' : 'var(--text-tertiary)',
                          fontWeight: rule.days.includes(i) ? 500 : 400
                        }}>{d}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--mono)' }}>
                      {rule.access_start} \u2013 {rule.access_end}
                    </div>
                  </div>
                )
              ))}

              {/* Screen Time Budget Section */}
              <div style={{
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: 16, marginTop: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="ti ti-hourglass" style={{ fontSize: 16, color: 'var(--amber)' }} aria-hidden="true" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Screen Time Budget</span>
                  </div>
                  <button onClick={() => setShowScreenTimeEditor(!showScreenTimeEditor)} style={{
                    background: 'none', border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '4px 8px',
                    color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer'
                  }}>
                    <i className={`ti ${showScreenTimeEditor ? 'ti-x' : 'ti-edit'}`} style={{ fontSize: 13 }} />
                  </button>
                </div>

                {showScreenTimeEditor ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <Toggle checked={stForm.enabled} onChange={v => setStForm(f => ({ ...f, enabled: v }))} />
                      <span style={{ fontSize: 13, color: stForm.enabled ? 'var(--amber)' : 'var(--text-tertiary)' }}>
                        {stForm.enabled ? 'Screen time limit active' : 'No limit'}
                      </span>
                    </label>
                    {stForm.enabled && (
                      <>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Daily limit (minutes)
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min="15" max="480" step="15"
                              value={stForm.daily_minutes}
                              onChange={e => setStForm(f => ({ ...f, daily_minutes: parseInt(e.target.value) }))}
                              style={{ flex: 1, accentColor: 'var(--amber)' }} />
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--mono)', minWidth: 50, textAlign: 'right' }}>
                              {stForm.daily_minutes}m
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)' }}>
                            <span>15 min</span>
                            <span>{(stForm.daily_minutes / 60).toFixed(1)} hrs</span>
                            <span>8 hrs</span>
                          </div>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Reset at
                          </span>
                          <select value={stForm.reset_hour} onChange={e => setStForm(f => ({ ...f, reset_hour: parseInt(e.target.value) }))}
                            style={inputStyle}>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(h => (
                              <option key={h} value={h}>
                                {h === 0 ? 'Midnight' : h === 12 ? 'Noon' : h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`}
                              </option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowScreenTimeEditor(false)} style={btnSecondary}>Cancel</button>
                      <button onClick={saveScreenTime} disabled={stSaving} style={btnPrimary}>
                        {stSaving ? 'Saving\u2026' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Usage display */
                  <div>
                    {screenTime?.enabled ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text)' }}>
                            <strong>{Math.round(usage?.totalMinutes || 0)}</strong> min used
                          </span>
                          <span style={{ fontSize: 13, color: usage?.exhausted ? 'var(--red)' : 'var(--green)' }}>
                            {usage?.exhausted ? 'Exhausted' : `${Math.round(usage?.remaining || 0)} min remaining`}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div style={{
                          height: 6, borderRadius: 3, background: 'var(--bg-input)',
                          overflow: 'hidden', marginBottom: 8
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            width: `${Math.min(100, ((usage?.totalMinutes || 0) / (screenTime?.daily_minutes || 120)) * 100)}%`,
                            background: usage?.exhausted
                              ? 'var(--red)'
                              : (usage?.totalMinutes || 0) / (screenTime?.daily_minutes || 120) > 0.8
                                ? 'var(--amber)'
                                : 'var(--green)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          Resets at {screenTime.reset_hour === 0 ? 'midnight' : screenTime.reset_hour === 12 ? 'noon' : screenTime.reset_hour > 12 ? `${screenTime.reset_hour - 12}:00 PM` : `${screenTime.reset_hour}:00 AM`}
                          {usage?.devices?.length > 0 && (
                            <span> \u00b7 {usage.devices.length} device{usage.devices.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px 0' }}>
                        No screen time limit set
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: calendar */}
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 10 }}>
                Calendar overrides
              </div>
              <CalendarOverrides profileId={selectedProfile.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 32, height: 18, borderRadius: 18, cursor: 'pointer',
      background: checked ? 'var(--amber)' : 'var(--text-tertiary)',
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