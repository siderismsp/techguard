import { useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      onLogin(data)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'var(--bg)', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: 380, width: '100%', margin: '0 20px',
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: 32
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            <i className="ti ti-shield-lock" style={{ color: 'var(--accent)' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            TechGuard
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Sign in to manage your network
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--red-dim)', border: '0.5px solid rgba(248,113,113,0.2)',
            borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 16,
            fontSize: 12, color: 'var(--red)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Username
            </span>
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Password
            </span>
            <input value={password} onChange={e => setPassword(e.target.value)}
              type="password" placeholder="Enter your password"
              style={inputStyle} />
          </label>
          <button type="submit" disabled={loading || !username || !password}
            style={{
              width: '100%', padding: '10px 20px', marginTop: 4,
              background: 'var(--accent)', border: 'none',
              borderRadius: 'var(--radius-sm)', color: '#fff',
              fontSize: 14, fontWeight: 500, cursor: 'pointer'
            }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
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