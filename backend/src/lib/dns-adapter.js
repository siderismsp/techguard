/**
 * DNS Provider Adapter
 *
 * Loads the appropriate DNS backend module (Technitium or Pi-hole)
 * based on the DNS_PROVIDER setting. Both modules must export the
 * same interface so the rest of the codebase is provider-agnostic.
 */

let dnsProvider = null
let providerName = null

/**
 * Get the current DNS provider module, loading it if needed.
 * @returns {{ name: string, module: object }}
 */
export async function getDnsProvider() {
  if (dnsProvider) return { name: providerName, module: dnsProvider }

  // Read provider from settings or env
  const { getDb } = await import('./db.js')
  let name = process.env.DNS_PROVIDER || 'technitium'

  try {
    const db = getDb()
    db.exec(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )`)
    const row = db.prepare("SELECT value FROM settings WHERE key = 'dns_provider'").get()
    if (row) name = row.value
  } catch {}

  return loadProvider(name)
}

/**
 * Configure which DNS provider to use.
 * @param {'technitium'|'pihole'} name
 */
export async function setDnsProvider(name) {
  const { getDb } = await import('./db.js')
  const db = getDb()
  db.exec(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  )`)
  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES ('dns_provider', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `)
  upsert.run(name)

  // Reload provider
  dnsProvider = null
  providerName = null
  return loadProvider(name)
}

async function loadProvider(name) {
  let mod
  switch (name) {
    case 'pihole':
      mod = await import('./pihole.js')
      providerName = 'pihole'
      break
    case 'technitium':
    default:
      mod = await import('./technitium.js')
      providerName = 'technitium'
      break
  }

  // Run the provider's configureFromSettings if it exists
  if (mod.configureFromSettings) {
    try { await mod.configureFromSettings() } catch {}
  }

  dnsProvider = mod
  console.log(`[DNS] Using provider: ${providerName}`)
  return { name: providerName, module: dnsProvider }
}

/**
 * Auto-detect which DNS servers are available on the network.
 * Tries common IPs and ports.
 * @returns {Promise<Array<{provider: string, url: string, detected: boolean}>>}
 */
export async function detectDnsServers() {
  const candidates = [
    // Pi-hole common addresses
    { provider: 'pihole', url: 'http://192.168.1.1:80' },
    { provider: 'pihole', url: 'http://192.168.0.1:80' },
    { provider: 'pihole', url: 'http://192.168.1.2:80' },
    { provider: 'pihole', url: 'http://192.168.188.3:80' },
    { provider: 'pihole', url: 'http://192.168.188.55:80' },
    { provider: 'pihole', url: 'http://pi.hole:80' },
    // Technitium common addresses
    { provider: 'technitium', url: 'http://192.168.188.55:5380' },
    { provider: 'technitium', url: 'http://192.168.1.1:5380' },
    { provider: 'technitium', url: 'http://192.168.0.1:5380' },
    { provider: 'technitium', url: 'http://localhost:5380' },
  ]

  const results = []
  for (const c of candidates) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2000)

      let detected = false
      if (c.provider === 'pihole') {
        // Pi-hole v6 – /api/auth returns 401 without auth (that means Pi-hole is there)
        const res = await fetch(`${c.url}/api/auth`, { signal: controller.signal })
        // 401 = reachable but needs auth, 200 = reachable and already has session
        detected = res.status === 200 || res.status === 401
      } else {
        // Technitium — try a request without auth to see if it responds
        const res = await fetch(`${c.url}/api/dns/config`, {
          signal: controller.signal,
          headers: { 'Authorization': 'Bearer test' }
        })
        // Technitium returns 404 or invalid-token even without valid auth
        detected = res.status === 200 || res.status === 404
      }

      clearTimeout(timeout)

      if (detected && !results.find(r => r.url === c.url)) {
        results.push({ ...c, detected: true })
      }
    } catch {}
  }

  return results
}