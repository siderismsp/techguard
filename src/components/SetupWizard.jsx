import { useState, useEffect } from 'react'

const STEPS = ['welcome', 'detect', 'configure', 'credentials', 'admin']

export default function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(0)
  const [detectedServers, setDetectedServers] = useState([])
  const [detecting, setDetecting] = useState(false)
  const [provider, setProvider] = useState('technitium')
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [adminUsername, setAdminUsername] = useState('admin')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('')

  useEffect(() => {
    // Auto-detect on mount
    detectServers()
  }, [])

  async function detectServers() {
    setDetecting(true)
    try {
      const res = await fetch('/api/setup/detect')
      const data = await res.json()
      setDetectedServers(data.servers || [])
    } catch {}
    setDetecting(false)
  }

  function handleSelectProvider(p) {
    setProvider(p)
    if (p === 'technitium') {
      setUrl('http://192.168.188.55:5380')
    } else {
      setUrl('http://192.168.188.55:80')
    }
  }

  async function handleDetectedClick(s) {
    setProvider(s.provider)
    setUrl(s.url)
    if (s.provider === 'technitium') {
      setStep(3) // Go to API key
    } else {
      setStep(3) // Go to password
    }
  }

  async function handleFinish() {
    setSaving(true)
    setStatusMsg('')
    try {
      // 1. Set the provider
      await fetch('/api/setup/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      })

      // 2. Save credentials
      const creds = { provider }
      if (provider === 'technitium') {
        creds.url = url
        creds.apiKey = apiKey
      } else {
        creds.url = url
        creds.password = password
      }

      const res = await fetch('/api/setup/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }

      // 3. Create admin account
      const authRes = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      })
      if (!authRes.ok) {
        const err = await authRes.json()
        throw new Error(err.error || 'Admin account creation failed')
      }

      // Save to localStorage as well
      localStorage.setItem('techguard_dns_provider', provider)
      if (url) localStorage.setItem('techguard_url', url)
      if (apiKey) localStorage.setItem('techguard_apikey', apiKey)
      if (password) localStorage.setItem('techguard_password', password)

      onComplete?.(provider)
    } catch (e) {
      setStatusMsg('Error: ' + e.message)
    }
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg)', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: 480, width: '100%', margin: '0 20px',
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: 32
      }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {step === 0 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>
                <i className="ti ti-shield-lock" style={{ color: 'var(--accent)' }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                Welcome to TechGuard
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                TechGuard manages network access schedules and content filtering
                for your home network. First, let's connect to your DNS server.
              </p>
            </div>
            <button onClick={() => setStep(1)}
              style={primaryBtnStyle}>
              Get Started
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              Choose your DNS Server
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
              TechGuard works with Technitium DNS or Pi-hole. Select which one you're running.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <button onClick={() => handleSelectProvider('technitium')}
                style={{
                  ...cardBtnStyle,
                  borderColor: provider === 'technitium' ? 'var(--accent)' : 'var(--border)',
                  background: provider === 'technitium' ? 'var(--accent-dim)' : 'var(--bg-card)'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: 'var(--bg-input)', border: '0.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <i className="ti ti-database" style={{ fontSize: 20, color: 'var(--accent)' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)' }}>Technitium DNS</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Self-hosted DNS server with API key auth</div>
                  </div>
                </div>
              </button>

              <button onClick={() => handleSelectProvider('pihole')}
                style={{
                  ...cardBtnStyle,
                  borderColor: provider === 'pihole' ? 'var(--accent)' : 'var(--border)',
                  background: provider === 'pihole' ? 'var(--accent-dim)' : 'var(--bg-card)'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: 'var(--bg-input)', border: '0.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <i className="ti ti-shield-half" style={{ fontSize: 20, color: 'var(--accent)' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)' }}>Pi-hole</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Network-wide ad-blocker with web admin panel</div>
                  </div>
                </div>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(0)} style={secondaryBtnStyle}>Back</button>
              <button onClick={() => setStep(2)} disabled={!provider} style={primaryBtnStyle}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              Detecting DNS Servers
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
              Scanning your network for {provider === 'technitium' ? 'Technitium' : 'Pi-hole'} servers...
            </p>

            {detecting && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
                <i className="ti ti-loader" style={{ fontSize: 24, animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 12, marginTop: 8 }}>Scanning...</p>
              </div>
            )}

            {!detecting && detectedServers.filter(s => s.provider === provider).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Found on your network:
                </p>
                {detectedServers.filter(s => s.provider === provider).map(s => (
                  <button key={s.url} onClick={() => handleDetectedClick(s)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 12px',
                      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      color: 'var(--text)', fontSize: 13, marginBottom: 4
                    }}>
                    <i className="ti ti-check" style={{ color: 'var(--green)', marginRight: 8 }} />
                    {s.url}
                  </button>
                ))}
              </div>
            )}

            {!detecting && detectedServers.filter(s => s.provider === provider).length === 0 && (
              <div style={{
                background: 'var(--amber-dim)', border: '0.5px solid rgba(251,191,36,0.2)',
                borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 16,
                fontSize: 12, color: 'var(--amber)'
              }}>
                No {provider === 'technitium' ? 'Technitium' : 'Pi-hole'} servers auto-detected.
                You can enter the address manually.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(1)} style={secondaryBtnStyle}>Back</button>
              <button onClick={() => setStep(3)} style={primaryBtnStyle}>
                Enter Manually
              </button>
              <button onClick={detectServers} style={secondaryBtnStyle}>
                <i className="ti ti-refresh" style={{ marginRight: 4 }} />
                Rescan
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              {provider === 'technitium' ? 'Technitium Connection' : 'Pi-hole Connection'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
              {provider === 'technitium'
                ? 'Enter the URL and API key for your Technitium DNS Server.'
                : 'Enter the URL and web password for your Pi-hole.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Server URL</span>
                <input value={url} onChange={e => setUrl(e.target.value)}
                  placeholder={provider === 'technitium' ? 'http://192.168.188.55:5380' : 'http://pi.hole:80'}
                  style={inputStyle} />
              </label>

              {provider === 'technitium' ? (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>API Key</span>
                  <input value={apiKey} onChange={e => setApiKey(e.target.value)}
                    type="password" placeholder="Enter your Technitium API key"
                    style={inputStyle} />
                </label>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Web Password</span>
                  <input value={password} onChange={e => setPassword(e.target.value)}
                    type="password" placeholder="Enter your Pi-hole admin password"
                    style={inputStyle} />
                </label>
              )}
            </div>

            {statusMsg && (
              <div style={{
                background: statusMsg.startsWith('Error') ? 'var(--red-dim)' : 'var(--green-dim)',
                border: `0.5px solid ${statusMsg.startsWith('Error') ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
                borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 12,
                fontSize: 12, color: statusMsg.startsWith('Error') ? 'var(--red)' : 'var(--green)'
              }}>
                {statusMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(2)} style={secondaryBtnStyle}>Back</button>
              <button onClick={() => setStep(4)} disabled={!url.trim()} style={primaryBtnStyle}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              Create Admin Account
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
              Set a username and password to secure TechGuard. You'll need these to log in.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Username</span>
                <input value={adminUsername} onChange={e => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Password</span>
                <input value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                  type="password" placeholder="At least 4 characters"
                  style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Confirm Password</span>
                <input value={adminPasswordConfirm} onChange={e => setAdminPasswordConfirm(e.target.value)}
                  type="password" placeholder="Repeat password"
                  style={inputStyle} />
              </label>
            </div>

            {adminPassword && adminPasswordConfirm && adminPassword !== adminPasswordConfirm && (
              <div style={{
                background: 'var(--red-dim)', border: '0.5px solid rgba(248,113,113,0.2)',
                borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 12,
                fontSize: 12, color: 'var(--red)'
              }}>
                Passwords do not match
              </div>
            )}

            {statusMsg && (
              <div style={{
                background: statusMsg.startsWith('Error') ? 'var(--red-dim)' : 'var(--green-dim)',
                border: `0.5px solid ${statusMsg.startsWith('Error') ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
                borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 12,
                fontSize: 12, color: statusMsg.startsWith('Error') ? 'var(--red)' : 'var(--green)'
              }}>
                {statusMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(3)} style={secondaryBtnStyle}>Back</button>
              <button onClick={handleFinish} disabled={saving || !adminPassword || adminPassword.length < 4 || adminPassword !== adminPasswordConfirm} style={primaryBtnStyle}>
                {saving ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const primaryBtnStyle = {
  width: '100%', padding: '10px 20px',
  background: 'var(--accent)', border: 'none',
  borderRadius: 'var(--radius-sm)', color: '#fff',
  fontSize: 14, fontWeight: 500, cursor: 'pointer'
}

const secondaryBtnStyle = {
  padding: '10px 20px',
  background: 'none', border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
  fontSize: 14, cursor: 'pointer'
}

const cardBtnStyle = {
  width: '100%', padding: 12,
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer', fontSize: 13, textAlign: 'left' 
}

const inputStyle = {
  background: 'var(--bg-input)', border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '8px 12px',
  color: 'var(--text)', fontSize: 13, width: '100%',
  outline: 'none'
}