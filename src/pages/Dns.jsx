import { useState } from 'react'

export default function DnsPage() {
  const [upstreamDns, setUpstreamDns] = useState('https://dns.cloudflare.com/dns-query')
  const [blockLists, setBlockLists] = useState([
    { id: 'oisd', name: 'OISD Big', enabled: true, url: 'https://big.oisd.nl/', entries: 1250000 },
    { id: 'stevenblack', name: 'StevenBlack Unified', enabled: true, url: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts', entries: 78000 },
    { id: 'noads', name: 'NoAds Safe', enabled: false, url: 'https://raw.githubusercontent.com/notracking/hosts-blocklists/master/hostnames.txt', entries: 42000 },
  ])

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>DNS</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Upstream DNS servers and block list management
          </p>
        </div>

        {/* Upstream DNS */}
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 16
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 10 }}>
            Upstream DNS Server
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={upstreamDns} onChange={e => setUpstreamDns(e.target.value)}
              style={{
                flex: 1, background: 'var(--bg-input)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                color: 'var(--text)', fontSize: 13, fontFamily: 'var(--mono)',
                outline: 'none'
              }} />
            <button style={{
              background: 'var(--accent-dim)', border: '0.5px solid var(--accent)',
              borderRadius: 'var(--radius-sm)', padding: '7px 14px',
              color: 'var(--accent)', fontSize: 13, cursor: 'pointer'
            }}>Apply</button>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: 'Cloudflare', url: 'https://dns.cloudflare.com/dns-query' },
              { label: 'Quad9', url: 'https://dns.quad9.net/dns-query' },
              { label: 'NextDNS', url: 'https://dns.nextdns.io/' },
              { label: 'Google', url: 'https://dns.google/dns-query' },
            ].map(p => (
              <button key={p.label} onClick={() => setUpstreamDns(p.url)} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                background: 'var(--bg-input)', border: '0.5px solid var(--border)',
                color: 'var(--text-tertiary)'
              }}>{p.label}</button>
            ))}
          </div>
        </div>

        {/* Block Lists */}
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Block Lists</span>
            <button style={{
              background: 'none', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '4px 10px',
              color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} /> Add list
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {blockLists.map(bl => (
              <div key={bl.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: 'var(--bg-input)',
                borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border)'
              }}>
                <div onClick={() => setBlockLists(prev => prev.map(b => b.id === bl.id ? { ...b, enabled: !b.enabled } : b))} style={{
                  width: 34, height: 18, borderRadius: 18, cursor: 'pointer',
                  background: bl.enabled ? 'var(--green)' : 'var(--text-tertiary)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0
                }}>
                  <div style={{
                    position: 'absolute', width: 12, height: 12, borderRadius: '50%',
                    background: 'white', top: 3,
                    left: bl.enabled ? 19 : 3, transition: 'left 0.2s'
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>{bl.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--mono)' }}>
                    {(bl.entries / 1000).toFixed(0)}k domains
                  </div>
                </div>
                <button style={{
                  background: 'none', border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '4px 7px',
                  color: 'var(--text-secondary)', cursor: 'pointer'
                }}>
                  <i className="ti ti-refresh" style={{ fontSize: 13 }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}