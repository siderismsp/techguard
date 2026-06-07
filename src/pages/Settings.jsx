import { useState } from 'react'

export default function SettingsPage() {
  const [technitiumUrl, setTechnitiumUrl] = useState('http://192.168.1.1:5380')
  const [apiKey, setApiKey] = useState('')
  const [save, setSave] = useState(false)

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>Settings</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Configure connection to your Technitium DNS Server
          </p>
        </div>

        {/* Connection */}
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
            <button onClick={() => setSave(true)} style={{
              background: 'var(--accent-dim)', border: '0.5px solid var(--accent)',
              borderRadius: 'var(--radius-sm)', padding: '7px 14px',
              color: 'var(--accent)', fontSize: 13, cursor: 'pointer',
              alignSelf: 'flex-end'
            }}>
              {save ? 'Saved!' : 'Save Settings'}
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