/**
 * Pi-hole DNS Server API client.
 * Uses Pi-hole's API (v6+) for DNS management.
 *
 * Interface matches technitium.js so the dns-adapter can swap them.
 */

import { getDb } from './db.js'

// Pi-hole v6 uses a session-based auth: POST /api/auth with password, get a SID
let PIHOLE_URL = process.env.PIHOLE_URL || 'http://pi.hole:80'
let PIHOLE_PASSWORD = process.env.PIHOLE_PASSWORD || ''
let PIHOLE_SID = null
let PIHOLE_SID_EXPIRES = 0

// Default timeout for Pi-hole API calls (5 seconds)
const TIMEOUT_MS = parseInt(process.env.DNS_TIMEOUT_MS || '5000', 10)

export async function configureFromSettings() {
  try {
    const db = getDb()
    db.exec(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )`)
    const url = db.prepare("SELECT value FROM settings WHERE key = 'pihole_url'").get()
    const pw = db.prepare("SELECT value FROM settings WHERE key = 'pihole_password'").get()
    if (url) PIHOLE_URL = url.value
    if (pw) PIHOLE_PASSWORD = pw.value
    console.log(`[PIHOLE] Configured: ${PIHOLE_URL}`)
  } catch {}
}

export function getConfig() {
  return { url: PIHOLE_URL, password: PIHOLE_PASSWORD ? '***' : '(none)' }
}

/**
 * Authenticate with Pi-hole and get a session ID.
 * Pi-hole's API uses cookie-based sessions.
 */
async function authenticate() {
  if (PIHOLE_SID && Date.now() < PIHOLE_SID_EXPIRES) return PIHOLE_SID
  if (!PIHOLE_PASSWORD) return null

  try {
    const res = await fetch(`${PIHOLE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: PIHOLE_PASSWORD })
    })

    if (!res.ok) {
      throw new Error(`Auth failed: ${res.status}`)
    }

    const data = await res.json()
    // Pi-hole v6 returns { session: { sid, ... }, ... }
    PIHOLE_SID = data?.session?.sid || null
    // Sessions last ~24h, but we refresh every hour
    PIHOLE_SID_EXPIRES = Date.now() + 60 * 60 * 1000
    return PIHOLE_SID
  } catch (e) {
    PIHOLE_SID = null
    throw e
  }
}

async function piholeRequest(method, path, body = null) {
  const url = new URL(`${PIHOLE_URL}/api${path}`)
  const headers = { 'Content-Type': 'application/json' }

  const sid = await authenticate()
  if (sid) {
    headers['Cookie'] = `sid=${sid}`
    headers['X-FTL-SID'] = sid
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const opts = { method, headers, signal: controller.signal }
    if (body) opts.body = JSON.stringify(body)

    const res = await fetch(url.toString(), opts)

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Pi-hole API error ${res.status}: ${text}`)
    }

    return await res.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

// ── DHCP / Device Discovery ──────────────────────────────────────

export async function getDhcpLeases() {
  // Pi-hole's API doesn't expose DHCP leases directly via a standard endpoint.
  // Instead, we get network info from the query log and FTL's network table.
  try {
    const data = await piholeRequest('GET', '/network')
    // Pi-hole v6 returns { network: [{ hwaddr, ip, name, ... }] }
    const entries = data?.network || []

    return entries.map(e => ({
      hardwareAddress: e.hwaddr || '',
      ipAddress: e.ip || '',
      hostName: e.name || '',
      leaseExpires: e.lastQuery > 0 ? 1 : 0, // 1 = online
    }))
  } catch {
    // Fallback: return recent query clients
    try {
      const data = await piholeRequest('GET', '/dns/query?limit=100')
      const clients = data?.queries?.map(q => ({
        hardwareAddress: q.client?.replace(/\./g, ':') || '',
        ipAddress: q.client || '',
        hostName: q.name || '',
        leaseExpires: q.timestamp ? 1 : 0,
      })) || []
      // Deduplicate by IP
      const seen = new Set()
      return clients.filter(c => {
        if (!c.ipAddress || seen.has(c.ipAddress)) return false
        seen.add(c.ipAddress)
        return true
      })
    } catch {
      return []
    }
  }
}

// ── Domain Blocking ──────────────────────────────────────────────

export async function blockDomain(domain) {
  return piholeRequest('POST', `/gravity/block`, { domain })
}

export async function unblockDomain(domain) {
  return piholeRequest('DELETE', `/gravity/block/${encodeURIComponent(domain)}`)
}

export async function listBlockedDomains() {
  const data = await piholeRequest('GET', '/gravity/domains')
  return data?.domains || []
}

export async function addAllowedZone(domain) {
  return piholeRequest('POST', '/gravity/whitelist', { domain })
}

export async function removeAllowedZone(domain) {
  return piholeRequest('DELETE', `/gravity/whitelist/${encodeURIComponent(domain)}`)
}

// ── Content Filtering ────────────────────────────────────────────

export async function getContentFilteringStatus() {
  try {
    const data = await piholeRequest('GET', '/gravity/status')
    return {
      enabled: data?.enabled || false,
      categories: data?.categories || [],
      blockLists: data?.adlists || []
    }
  } catch {
    return { enabled: false, categories: [], blockLists: [] }
  }
}

export async function setContentFiltering(enabled) {
  if (enabled) {
    return piholeRequest('POST', '/dns/blocking', { blocking: true })
  } else {
    return piholeRequest('POST', '/dns/blocking', { blocking: false })
  }
}

export async function setForwarder(forwarder) {
  return piholeRequest('PUT', '/dns/forwarder', { forwarder })
}

// ── Block Lists ──────────────────────────────────────────────────

export async function getBlockLists() {
  try {
    const data = await piholeRequest('GET', '/gravity/adlists')
    return (data?.adlists || []).map(list => ({
      id: list.id || list.address,
      name: list.name || list.address,
      enabled: list.enabled || false,
      entries: list.count || 0,
      address: list.address
    }))
  } catch {
    return [
      { id: 'default', name: 'Default Block Lists', enabled: true, entries: 100000 }
    ]
  }
}

export async function enableBlockList(id, enable) {
  return piholeRequest('PUT', `/gravity/adlists/${id}`, { enabled: enable })
}

export async function updateBlockLists() {
  return piholeRequest('POST', '/gravity/update')
}

// ── Health ───────────────────────────────────────────────────────

export async function getHealth() {
  try {
    // Direct fetch to /api/auth — 401 means reachable but needs password
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(`${PIHOLE_URL}/api/auth`, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.status === 200) {
        const data = await res.json()
        return { technitium: !!(data?.session), needsAuth: false }
      }
      // 401 = Pi-hole is there but needs auth
      return { technitium: true, needsAuth: true }
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (e) {
    const msg = e.message || ''
    console.log('[PIHOLE HEALTH] Error:', msg)
    return { technitium: false }
  }
}
