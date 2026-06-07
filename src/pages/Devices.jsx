import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import DeviceCard from '../components/DeviceCard'

export default function DevicesPage() {
  const [devices, setDevices] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterProfile, setFilterProfile] = useState('all')

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  async function load() {
    try {
      const [devs, profs] = await Promise.all([api.getDevices(), api.getProfiles()])
      setDevices(devs)
      setProfiles(profs)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function updateDevice(updated) {
    setDevices(ds => ds.map(d => d.mac === updated.mac ? { ...d, ...updated } : d))
  }

  const filtered = devices.filter(d => {
    if (filterProfile !== 'all' && d.profile !== filterProfile) return false
    if (search) {
      const q = search.toLowerCase()
      return d.name?.toLowerCase().includes(q) || d.mac?.includes(q) || d.ip?.includes(q)
    }
    return true
  })

  const online = devices.filter(d => d.online).length

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>Devices</h1>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {online} online \u00b7 {devices.length} total
            </p>
          </div>
          <button onClick={load} style={{
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
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, IP, or MAC\u2026"
            style={{
              flex: 1, background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '8px 12px',
              color: 'var(--text)', fontSize: 13, outline: 'none'
            }} />
          <select value={filterProfile} onChange={e => setFilterProfile(e.target.value)}
            style={{
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '8px 12px',
              color: 'var(--text)', fontSize: 13, outline: 'none'
            }}>
            <option value="all">All profiles</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Device list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>Loading devices\u2026</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>
            {search ? 'No devices match your search' : 'No devices found \u2014 make sure Technitium DHCP is active'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(device => (
              <DeviceCard key={device.mac} device={device} profiles={profiles} onUpdate={updateDevice} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}