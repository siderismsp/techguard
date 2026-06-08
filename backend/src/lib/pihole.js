/**
 * Pi-hole DNS Server API client.
 * Uses Pi-hole's v6 REST API for DNS management.
 *
 * Interface matches technitium.js so the dns-adapter can swap them.
 *
 * IMPORTANT: Reuses a single session (SID) across all requests to avoid
 * exhausting Pi-hole's max_sessions limit (default 16). The session is
 * only refreshed when it expires or returns 401.
 */

import { getDb } from './db.js'

let PIHOLE_URL = process.env.PIHOLE_URL || 'http://pi.hole:80'
let PIHOLE_PASSWORD = process.env.PIHOLE_PASSWORD || ''
let PIHOLE_SID = null
let PIHOLE_SID_EXPIRES = 0

const TIMEOUT_MS = parseInt(process.env.DNS_TIMEOUT_MS || '5000', 10)

export async function configureFromSettings() {
  try {
    const db = getDb()
    db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))`)
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
 * Authenticate with Pi-hole and cache the session ID.
 * Reuses the cached SID until it expires or the server rejects it.
 * This prevents exhausting Pi-hole's max_sessions limit.
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
    if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
    const data = await res.json()
    PIHOLE_SID = data?.session?.sid || null
    // Use the server's validity period (default 1800s = 30min) minus a safety margin
    const validity = data?.session?.validity || 1800
    PIHOLE_SID_EXPIRES = Date.now() + (validity - 60) * 1000 // refresh 1min early
    return PIHOLE_SID
  } catch (e) {
    PIHOLE_SID = null
    throw e
  }
}

/**
 * Make an authenticated request to the Pi-hole API.
 * If the server returns 401 (session expired), it clears the cached SID
 * and re-authenticates automatically on the next call.
 */
async function piholeRequest(method, path, body = null) {
  const url = new URL(`${PIHOLE_URL}/api${path}`)
  const headers = { 'Content-Type': 'application/json' }
  const sid = await authenticate()
  if (sid) { headers['Cookie'] = `sid=${sid}`; headers['X-FTL-SID'] = sid }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const opts = { method, headers, signal: controller.signal }
    if (body) opts.body = JSON.stringify(body)
    const res = await fetch(url.toString(), opts)
    if (!res.ok) {
      // If session expired, clear it so next call re-authenticates
      if (res.status === 401) {
        PIHOLE_SID = null
      }
      const text = await res.text()
      throw new Error(`Pi-hole API error ${res.status}: ${text}`)
    }
    return await res.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

// ── Device Discovery ─────────────────────────────────────────────

export async function getDhcpLeases() {
  // 1. /api/network/devices — all devices Pi-hole has seen (MAC + IP + hostname)
  try {
    const data = await piholeRequest('GET', '/network/devices')
    const entries = data?.devices || []
    return entries.flatMap(e => {
      const hwaddr = e.hwaddr || ''
      const ips = e.ips || []
      if (ips.length > 0) {
        return ips.map(ip => ({
          hardwareAddress: hwaddr,
          ipAddress: ip.ip || '',
          hostName: ip.name || e.macVendor || 'Unknown',
          leaseExpires: 1,
        }))
      }
      return [{
        hardwareAddress: hwaddr,
        ipAddress: '',
        hostName: e.macVendor || 'Unknown',
        leaseExpires: 1,
      }]
    })
  } catch {}

  // 2. /api/dhcp/leases — active DHCP leases (MAC + IP + hostname)
  try {
    const data = await piholeRequest('GET', '/dhcp/leases')
    const entries = data?.leases || []
    return entries.map(e => ({
      hardwareAddress: e.hwaddr || '',
      ipAddress: e.ip || '',
      hostName: e.name || 'Unknown',
      leaseExpires: e.expires || 0,
    }))
  } catch {}

  // 3. /api/stats/top_clients — fallback, IP only
  try {
    const data = await piholeRequest('GET', '/stats/top_clients')
    const clients = data?.clients || []
    return clients.map(c => ({
      hardwareAddress: '',
      ipAddress: c.ip || '',
      hostName: c.name || c.ip || 'Unknown',
      leaseExpires: 1,
    }))
  } catch { return [] }
}

// ── Domain Blocking ──────────────────────────────────────────────

/**
 * Block a domain. Checks if it already exists first to avoid
 * UNIQUE constraint violations in Pi-hole's gravity database.
 */
export async function blockDomain(domain) {
  // First check if already blocked
  const existing = await listBlockedDomains()
  const alreadyBlocked = existing.some(d =>
    typeof d === 'string' ? d === domain : d.domain === domain
  )
  if (alreadyBlocked) {
    console.log(`[PIHOLE] Domain already blocked, skipping: ${domain}`)
    return { domain, alreadyBlocked: true }
  }
  return piholeRequest('POST', '/domains/blocked/exact', { domain })
}

export async function unblockDomain(domain) {
  return piholeRequest('DELETE', `/domains/blocked/exact/${encodeURIComponent(domain)}`)
}

export async function listBlockedDomains() {
  const data = await piholeRequest('GET', '/domains/blocked/exact')
  return data?.domains || []
}

export async function addAllowedZone(domain) {
  return piholeRequest('POST', '/domains/allow/exact', { domain })
}

export async function removeAllowedZone(domain) {
  return piholeRequest('DELETE', `/domains/allow/exact/${encodeURIComponent(domain)}`)
}

// ── Content Filtering ────────────────────────────────────────────

export async function getContentFilteringStatus() {
  try {
    const data = await piholeRequest('GET', '/dns/blocking')
    return { enabled: data?.blocking || false, categories: [], blockLists: [] }
  } catch {
    return { enabled: false, categories: [], blockLists: [] }
  }
}

export async function setContentFiltering(enabled) {
  return piholeRequest('POST', '/dns/blocking', { blocking: enabled })
}

export async function setForwarder(forwarder) {
  return piholeRequest('PATCH', '/config/dns/upstreams', [forwarder])
}

// ── Block Lists ──────────────────────────────────────────────────

export async function getBlockLists() {
  try {
    const data = await piholeRequest('GET', '/lists')
    return (data?.lists || []).map(list => ({
      id: list.id || list.address,
      name: list.name || list.address,
      enabled: list.enabled || false,
      entries: list.count || 0,
      address: list.address,
    }))
  } catch {
    return [{ id: 'default', name: 'Default Lists', enabled: true, entries: 100000 }]
  }
}

export async function enableBlockList(id, enable) {
  return piholeRequest('PUT', `/lists/${id}`, { enabled: enable })
}

export async function updateBlockLists() {
  return piholeRequest('POST', '/action/gravity')
}

// ── Health ───────────────────────────────────────────────────────

export async function getHealth() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(`${PIHOLE_URL}/api/auth`, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.status === 200) {
        const data = await res.json()
        return { technitium: !!(data?.session), needsAuth: false }
      }
      // 401 = reachable; try authenticating with saved password
      if (PIHOLE_PASSWORD) {
        try {
          const authRes = await fetch(`${PIHOLE_URL}/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: PIHOLE_PASSWORD })
          })
          if (authRes.ok) {
            const authData = await authRes.json()
            if (authData?.session?.sid) {
              PIHOLE_SID = authData.session.sid
              const validity = authData?.session?.validity || 1800
              PIHOLE_SID_EXPIRES = Date.now() + (validity - 60) * 1000
              return { technitium: true, needsAuth: false }
            }
          }
          return { technitium: true, needsAuth: true }
        } catch {}
      }
      return { technitium: true, needsAuth: true }
    } finally { clearTimeout(timeoutId) }
  } catch (e) {
    console.log('[PIHOLE HEALTH] Error:', e.message)
    return { technitium: false }
  }
}