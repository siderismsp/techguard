import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function SettingsPage() {
  const [technitiumUrl, setTechnitiumUrl] = useState('http://192.168.1.1:5380')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    // Load saved settings and health status
    Promise.all([
      api.getHealth(),
      fetch('/api/settings').then(r => r.json()).catch(() => ({}))
    ]).then(([h, s]) => {
      setHealth(h)
      if (s.technitium_url) setTechnitiumUrl(s.technitium_url)
      if (s.technitium_api_key) setApiKey(s.technitium_api_key)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technitium_url: technitiumUrl,
          technitium_api_key: apiKey
        })
      })
      setSaved(true)
      // Re-check health after saving
      const h = await api.getHealth()
      setHealth(h)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert('Failed to save: ' + e.message)
    }
    setSaving(false)
  }

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Loading\u2026</div>

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>Settings</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Configure connection to your Technitium DNS Server
          </p>
        </div>

        {/* Connection status */}
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: health?.technitium ? 'var(--green)' : 'var(--red)'
          }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
              {health?.technitium ? 'Connected' : 'Disconnected'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {health?.technitium
                ? `Technitium DNS Server at ${technitiumUrl}`
                : 'Check your server URL and API key below'}
            </div>
          </div>
        </div>

        {/* Connection form */}
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 16
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 12 }}>
            Technitium DNS Connection
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Server URL</span>
              <input value={technitiumUrl} onChange={e => setTechnitiumUrl(e.target.value)}
                placeholder="http://192.168.1.1:5380"
                style={inputStyle} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>API Key</span>
              <input value={apiKey} onChange={e => setApiKey(e.target.value)}
                type="password" placeholder="Enter your Technitium API key"
                style={inputStyle} />
            </label>
            <button onClick={save} disabled={saving} style={{
              background: 'var(--accent-dim)', border: '0.5px solid var(--accent)',
              borderRadius: 'var(--radius-sm)', padding: '7px 14px',
              color: saved ? 'var(--green)' : 'var(--accent)',
              fontSize: 13, cursor: 'pointer', alignSelf: 'flex-end'
            }}>
              {saving ? 'Saving\u2026' : saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* About */}
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 16
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 10 }}>
            About TechGuard
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
            <p><strong style={{ color: 'var(--text-secondary)' }}>Version:</strong> 1.0.0</p>
            <p><strong style={{ color: 'var(--text-secondary)' }}>Frontend:</strong> React + Vite</p>
            <p><strong style={{ color: 'var(--text-secondary)' }}>Backend:</strong> Node.js proxy for Technitium DNS Server API</p>
            <p style={{ marginTop: 8 }}>
              TechGuard provides schedule-based access control and content filtering
              for your home network through the Technitium DNS Server.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  background: 'var(--bg-input)', border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '8px 12px',
  color: 'var(--text)', fontSize: 13, width: '100%',
  outline: 'none'
}