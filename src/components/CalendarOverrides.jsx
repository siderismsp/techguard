import { useState, useEffect } from 'react'
import { api } from '../lib/api'

const OVERRIDE_TYPES = [
  { id: 'blocked', label: 'Block all day', color: 'var(--red)', bg: 'var(--red-dim)' },
  { id: 'unrestricted', label: 'Unrestricted', color: 'var(--green)', bg: 'var(--green-dim)' },
  { id: 'inherit_weekend', label: 'Weekend rules', color: 'var(--teal)', bg: 'rgba(45,212,191,0.1)' },
  { id: 'normal', label: 'Reset to default', color: 'var(--text-secondary)', bg: 'var(--bg-input)' },
]

const TYPE_STYLES = {
  blocked: { bg: 'rgba(248,113,113,0.18)', color: 'var(--red)', border: 'rgba(248,113,113,0.3)' },
  unrestricted: { bg: 'rgba(74,222,128,0.15)', color: 'var(--green)', border: 'rgba(74,222,128,0.3)' },
  inherit_weekend: { bg: 'rgba(45,212,191,0.12)', color: 'var(--teal)', border: 'rgba(45,212,191,0.25)' },
}

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarOverrides({ profileId }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [overrides, setOverrides] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadOverrides() }, [profileId, year, month])

  async function loadOverrides() {
    setLoading(true)
    try {
      const data = await api.getOverrides(profileId, year, month + 1)
      const map = {}
      for (const o of data) map[o.date] = o
      setOverrides(map)
    } catch {}
    setLoading(false)
  }

  async function setOverride(date, type) {
    try {
      await api.setOverride(profileId, { date, type })
      setOverrides(prev => {
        const next = { ...prev }
        if (type === 'normal') { delete next[date] } 
        else { next[date] = { date, type } }
        return next
      })
    } catch (e) {
      alert('Failed: ' + e.message)
    }
    setSelected(null)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // Build calendar days
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const todayStr = today.toISOString().slice(0, 10)

  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={prevMonth} style={navBtn}><i className="ti ti-chevron-left" style={{ fontSize: 14 }} /></button>
          <button onClick={nextMonth} style={navBtn}><i className="ti ti-chevron-right" style={{ fontSize: 14 }} /></button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAY_HEADERS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-tertiary)', paddingBottom: 4, fontWeight: 500 }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const override = overrides[dateStr]
          const isToday = dateStr === todayStr
          const styles = override ? TYPE_STYLES[override.type] : null

          return (
            <button key={dateStr} onClick={() => setSelected(selected === dateStr ? null : dateStr)}
              style={{
                aspectRatio: '1', borderRadius: 8, fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.1s',
                background: styles?.bg || (isToday ? 'var(--accent-dim)' : 'var(--bg-input)'),
                color: styles?.color || (isToday ? 'var(--accent)' : 'var(--text-secondary)'),
                border: `0.5px solid ${styles?.border || (isToday ? 'var(--accent)' : 'var(--border)')}`,
                fontWeight: isToday ? 500 : 400,
                outline: selected === dateStr ? '2px solid var(--accent)' : 'none',
                outlineOffset: 1
              }}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Override picker popover */}
      {selected && (
        <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border-focus)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Override for <strong style={{ color: 'var(--text)' }}>{selected}</strong>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {OVERRIDE_TYPES.map(t => (
              <button key={t.id} onClick={() => setOverride(selected, t.id)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                background: t.bg, color: t.color,
                border: `0.5px solid ${t.color}40`
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
        {Object.entries(TYPE_STYLES).map(([type, s]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.bg, border: `0.5px solid ${s.border}` }} />
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {type === 'blocked' ? 'Blocked' : type === 'unrestricted' ? 'Unrestricted' : 'Weekend rules'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const navBtn = {
  background: 'var(--bg-input)', border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '4px 8px',
  color: 'var(--text-secondary)', cursor: 'pointer',
  display: 'flex', alignItems: 'center'
}