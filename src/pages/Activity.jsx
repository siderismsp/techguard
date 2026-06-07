import { useState, useEffect } from 'react'
import { api } from '../lib/api'

const CATEGORY_COLORS = {
  gaming: { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.25)' },
  social_media: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  streaming: { bg: 'rgba(45,212,191,0.1)', text: '#2dd4bf', border: 'rgba(45,212,191,0.2)' },
  chat: { bg: 'rgba(108,138,255,0.12)', text: '#6c8aff', border: 'rgba(108,138,255,0.25)' },
  education: { bg: 'rgba(74,222,128,0.12)', text: '#4ade80', border: 'rgba(74,222,128,0.25)' },
  shopping: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
  ai: { bg: 'rgba(45,212,191,0.12)', text: '#2dd4bf', border: 'rgba(45,212,191,0.25)' },
  tracking: { bg: 'rgba(248,113,113,0.08)', text: '#f87171', border: 'rgba(248,113,113,0.15)' },
  system: { bg: 'rgba(139,145,168,0.1)', text: '#8b91a8', border: 'rgba(139,145,168,0.2)' },
  search: { bg: 'rgba(108,138,255,0.1)', text: '#6c8aff', border: 'rgba(108,138,255,0.2)' },
  productivity: { bg: 'rgba(74,222,128,0.1)', text: '#4ade80', border: 'rgba(74,222,128,0.2)' },
  reference: { bg: 'rgba(167,139,250,0.1)', text: '#a78bfa', border: 'rgba(167,139,250,0.2)' },
  cloud: { bg: 'rgba(108,138,255,0.08)', text: '#6c8aff', border: 'rgba(108,138,255,0.15)' },
  infrastructure: { bg: 'rgba(139,145,168,0.08)', text: '#8b91a8', border: 'rgba(139,145,168,0.15)' },
  other: { bg: 'rgba(139,145,168,0.06)', text: '#8b91a8', border: 'rgba(139,145,168,0.1)' },
}

const PERIODS = [
  { value: '1', label: 'Last hour' },
  { value: '6', label: '6 hours' },
  { value: '24', label: '24 hours' },
  { value: '72', label: '3 days' },
  { value: '168', label: '7 days' },
]

export default function ActivityPage() {
  const [activity, setActivity] = useState(null)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [hours, setHours] = useState('24')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('services') // services | domains | timeline

  useEffect(() => {
    api.getDevices().then(setDevices).catch(() => {})
  }, [])

  useEffect(() => {
    loadActivity()
    const t = setInterval(loadActivity, 30000)
    return () => clearInterval(t)
  }, [selectedDevice, hours])

  async function loadActivity() {
    try {
      const params = { hours }
      if (selectedDevice) params.device_mac = selectedDevice
      const data = await api.getActivity(params)
      setActivity(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const maxHits = activity?.services?.length > 0
    ? Math.max(...activity.services.map(s => s.hit_count))
    : 1

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>Activity</h1>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
              See what services and sites devices are accessing
            </p>
          </div>
          <button onClick={loadActivity} style={{
            background: 'none', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '6px 12px',
            color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <i className="ti ti-refresh" style={{ fontSize: 14 }} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <select value={hours} onChange={e => setHours(e.target.value)}
            style={{
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '7px 12px',
              color: 'var(--text)', fontSize: 13, outline: 'none'
            }}>
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}
            style={{
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '7px 12px',
              color: 'var(--text)', fontSize: 13, outline: 'none'
            }}>
            <option value="">All devices</option>
            {devices.map(d => (
              <option key={d.mac} value={d.mac}>{d.name} ({d.ip})</option>
            ))}
          </select>

          {/* View tabs */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {['services', 'domains', 'timeline'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                background: view === v ? 'var(--accent-dim)' : 'transparent',
                color: view === v ? 'var(--accent)' : 'var(--text-tertiary)',
                border: `0.5px solid ${view === v ? 'var(--accent)' : 'var(--border)'}`,
                textTransform: 'capitalize'
              }}>{v}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>Loading activity\u2026</div>
        ) : !activity || activity.summary.total === 0 ? (
          <div style={{
            textAlign: 'center', padding: 60, color: 'var(--text-tertiary)',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '0.5px solid var(--border)'
          }}>
            <i className="ti ti-activity-heartbeat" style={{ fontSize: 32, color: 'var(--text-tertiary)', marginBottom: 12, display: 'block' }} />
            No activity data yet.
            <br /><span style={{ fontSize: 12 }}>DNS query logs will appear here once Technitium is connected and forwarding logs.</span>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Total Queries', value: activity.summary.total.toLocaleString(), icon: 'ti-database' },
                { label: 'Blocked', value: activity.summary.totalBlocked.toLocaleString(), icon: 'ti-shield-off', color: 'var(--red)' },
                { label: 'Services', value: activity.summary.uniqueServices, icon: 'ti-apps' },
                { label: 'Devices', value: activity.devices.length, icon: 'ti-devices' },
              ].map(card => (
                <div key={card.label} style={{
                  background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '14px 16px'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className={`ti ${card.icon}`} style={{ fontSize: 14, color: card.color || 'var(--text-secondary)' }} aria-hidden="true" />
                    {card.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 500, color: card.color || 'var(--text)' }}>
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Services view */}
            {view === 'services' && (
              <div style={{
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: 16
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 12 }}>
                  Top Services
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activity.services.map(s => {
                    const colors = CATEGORY_COLORS[s.category] || CATEGORY_COLORS.other
                    const pct = (s.hit_count / maxHits) * 100
                    return (
                      <div key={s.service} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-input)', position: 'relative', overflow: 'hidden'
                      }}>
                        {/* Bar background */}
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: `${pct}%`, background: colors.bg,
                          borderRadius: 'var(--radius-sm)',
                          transition: 'width 0.3s ease'
                        }} />
                        {/* Content */}
                        <div style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: colors.bg, border: `0.5px solid ${colors.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, position: 'relative', zIndex: 1
                        }}>
                          <i className={`ti ${s.icon || 'ti-world'}`} style={{ fontSize: 14, color: colors.text }} aria-hidden="true" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>
                            {s.service}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                            {s.category?.replace(/_/g, ' ')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', position: 'relative', zIndex: 1, flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                            {s.hit_count.toLocaleString()}
                          </div>
                          {s.blocked_count > 0 && (
                            <div style={{ fontSize: 10, color: 'var(--red)' }}>
                              {s.blocked_count} blocked
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Domains view */}
            {view === 'domains' && (
              <div style={{
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: 16
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 12 }}>
                  Top Domains
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {activity.topDomains.map((d, i) => (
                    <div key={d.domain} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                      background: i % 2 === 0 ? 'var(--bg-input)' : 'transparent'
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', width: 20, textAlign: 'right' }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.domain}
                        </div>
                        {d.service && (
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                            {d.service}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--mono)' }}>
                        {d.hit_count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline view */}
            {view === 'timeline' && (
              <div style={{
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: 16
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 12 }}>
                  Query Timeline
                </div>
                {activity.timeline.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', gap: 2, height: 80, alignItems: 'flex-end', marginBottom: 8 }}>
                      {activity.timeline.map((t, i) => {
                        const maxTimeline = Math.max(...activity.timeline.map(x => x.hits), 1)
                        const height = (t.hits / maxTimeline) * 100
                        return (
                          <div key={i} style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: 2
                          }}>
                            <div style={{
                              width: '100%', height: `${Math.max(height, 4)}%`,
                              background: t.blocked > 0
                                ? 'linear-gradient(to top, var(--red-dim), var(--red))'
                                : 'var(--accent-dim)',
                              borderRadius: '2px 2px 0 0',
                              minHeight: 4,
                              transition: 'height 0.3s ease'
                            }} />
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-tertiary)' }}>
                      {activity.timeline.filter((_, i) => i % Math.max(1, Math.floor(activity.timeline.length / 6)) === 0).map(t => (
                        <span key={t.hour}>{t.hour.slice(5, 16)}</span>
                      ))}
                      <span>{activity.timeline[activity.timeline.length - 1]?.hour.slice(5, 16)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>
                    No timeline data available
                  </div>
                )}
              </div>
            )}

            {/* Device breakdown */}
            {activity.devices.length > 0 && (
              <div style={{
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: 16, marginTop: 12
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 10 }}>
                  Devices
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activity.devices.map(d => (
                    <div key={d.device_mac} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)'
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'var(--accent-dim)', border: '0.5px solid var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 500, color: 'var(--accent)', flexShrink: 0
                      }}>
                        {(d.device_name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                          {d.device_name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--mono)' }}>
                          {d.device_mac}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--mono)' }}>
                        {d.hits.toLocaleString()} queries
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}