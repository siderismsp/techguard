import { useState, useEffect } from 'react'
import { api } from '../lib/api'

const CATEGORY_GROUPS = [
  {
    group: 'Content Filtering',
    categories: [
      { id: 'adult', label: 'Adult Content', desc: 'Pornography, explicit material', icon: 'ti-gender-agennder' },
      { id: 'violence', label: 'Violence & Hate', desc: 'Graphic violence, hate speech, extremism', icon: 'ti-alert-triangle' },
      { id: 'weapons', label: 'Weapons & Explosives', desc: 'Firearms, explosives, military-grade content', icon: 'ti-flame' },
      { id: 'gambling', label: 'Gambling', desc: 'Online casinos, betting, lotteries', icon: 'ti-dice-5' },
      { id: 'drugs', label: 'Drugs & Alcohol', desc: 'Substance abuse, drug paraphernalia', icon: 'ti-pill' },
    ]
  },
  {
    group: 'Social & Communication',
    categories: [
      { id: 'social_media', label: 'Social Media', desc: 'Facebook, Instagram, TikTok, Twitter, Snapchat', icon: 'ti-messages' },
      { id: 'chat', label: 'Chat & Messaging', desc: 'WhatsApp, Telegram, Discord, Signal', icon: 'ti-message-chatbot' },
      { id: 'forums', label: 'Forums & Communities', desc: 'Reddit, 4chan, discussion boards', icon: 'ti-brand-reddit' },
      { id: 'dating', label: 'Dating Services', desc: 'Tinder, Bumble, match.com', icon: 'ti-heart' },
    ]
  },
  {
    group: 'Entertainment & Media',
    categories: [
      { id: 'streaming', label: 'Video Streaming', desc: 'YouTube, Netflix, Hulu, Twitch', icon: 'ti-player-play' },
      { id: 'gaming', label: 'Gaming', desc: 'Online multiplayer, Roblox, Fortnite, Steam', icon: 'ti-device-gamepad-2' },
      { id: 'anime', label: 'Anime & Manga', desc: 'Anime streaming sites, manga', icon: 'ti-brush' },
    ]
  },
  {
    group: 'Productivity & Tools',
    categories: [
      { id: 'torrent', label: 'Torrents & P2P', desc: 'BitTorrent, file-sharing networks', icon: 'ti-download' },
      { id: 'proxy', label: 'Proxy & VPN', desc: 'VPN services, proxy sites, anonymizers', icon: 'ti-shield-off' },
      { id: 'malware', label: 'Malware & Phishing', desc: 'Known malicious domains, phishing sites', icon: 'ti-bug' },
      { id: 'ads', label: 'Ad & Tracking', desc: 'Ad networks, analytics, trackers', icon: 'ti-ad' },
    ]
  },
]

const BLOCK_ACTIONS = [
  { id: 'block', label: 'Block', icon: 'ti-circle-x', color: 'var(--red)', bg: 'var(--red-dim)' },
  { id: 'warn', label: 'Warn', icon: 'ti-alert-triangle', color: 'var(--amber)', bg: 'var(--amber-dim)' },
  { id: 'allow', label: 'Allow', icon: 'ti-circle-check', color: 'var(--green)', bg: 'var(--green-dim)' },
]

export default function ParentalControlsPage() {
  const [profiles, setProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    api.getProfiles().then(p => {
      setProfiles(p)
      if (p.length > 0) setSelectedProfile(p[0])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (selectedProfile) loadFilters()
  }, [selectedProfile])

  async function loadFilters() {
    try {
      const data = await api.getContentFilters()
      const map = {}
      for (const f of data) map[f.id] = f
      setFilters(map)
    } catch {
      // If backend doesn't have filters yet, use defaults
      const defaults = {}
      for (const group of CATEGORY_GROUPS) {
        for (const cat of group.categories) {
          defaults[`${selectedProfile.id}_${cat.id}`] = {
            id: `${selectedProfile.id}_${cat.id}`,
            category: cat.id,
            profile: selectedProfile.id,
            action: 'allow',
            enabled: false,
          }
        }
      }
      setFilters(defaults)
    }
  }

  async function setFilterAction(filterId, newAction) {
    setSavingId(filterId)
    try {
      await api.updateContentFilter(filterId, { action: newAction, enabled: newAction !== 'allow' })
      setFilters(prev => ({
        ...prev,
        [filterId]: { ...prev[filterId], action: newAction, enabled: newAction !== 'allow' }
      }))
    } catch (e) {
      alert('Failed to update filter: ' + e.message)
    }
    setSavingId(null)
  }

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Loading\u2026</div>

  const profileColor = (id) => {
    const map = { kids: 'var(--purple)', adult: 'var(--teal)', iot: 'var(--text-secondary)' }
    return map[id] || 'var(--accent)'
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>Parental Controls</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Block or warn about content categories per profile
          </p>
        </div>

        {/* Profile tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {profiles.map(p => {
            const active = selectedProfile?.id === p.id
            const color = profileColor(p.id)
            return (
              <button key={p.id} onClick={() => setSelectedProfile(p)}
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

        {/* Content category groups */}
        {CATEGORY_GROUPS.map(group => {
          const blockedCount = group.categories.filter(c => {
            const f = filters[`${selectedProfile?.id}_${c.id}`]
            return f && (f.action === 'block' || f.action === 'warn')
          }).length

          return (
            <div key={group.group} style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500
              }}>
                <span>{group.group}</span>
                {blockedCount > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {blockedCount}/{group.categories.length} blocked
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.categories.map(cat => {
                  const filterId = `${selectedProfile?.id}_${cat.id}`
                  const filter = filters[filterId]
                  const action = filter?.action || 'allow'
                  const enabled = filter?.enabled || false
                  const isBlocked = action === 'block'
                  const isWarned = action === 'warn'
                  const isSaving = savingId === filterId

                  return (
                    <div key={cat.id} style={{
                      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-lg)', padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'border-color 0.15s',
                      opacity: selectedProfile ? 1 : 0.5
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: isBlocked ? 'var(--red-dim)' : isWarned ? 'var(--amber-dim)' : 'var(--bg-input)',
                        border: `0.5px solid ${isBlocked ? 'rgba(248,113,113,0.2)' : isWarned ? 'rgba(251,191,36,0.2)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <i className={`ti ${cat.icon}`} style={{
                          fontSize: 16,
                          color: isBlocked ? 'var(--red)' : isWarned ? 'var(--amber)' : 'var(--text-tertiary)'
                        }} aria-hidden="true" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', marginBottom: 1 }}>
                          {cat.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {cat.desc}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {BLOCK_ACTIONS.map(a => {
                          const active = a.id === action
                          return (
                            <button key={a.id}
                              onClick={() => !isSaving && setFilterAction(filterId, a.id)}
                              disabled={isSaving}
                              style={{
                                padding: '5px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                                background: active ? a.bg : 'transparent',
                                color: active ? a.color : 'var(--text-tertiary)',
                                border: `0.5px solid ${active ? a.color + '40' : 'var(--border)'}`,
                                display: 'flex', alignItems: 'center', gap: 4,
                                transition: 'all 0.15s'
                              }}
                            >
                              <i className={`ti ${a.icon}`} style={{ fontSize: 13 }} aria-hidden="true" />
                              {a.label}
                              {isSaving && active && ' ...'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}