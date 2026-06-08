/**
 * Pi-hole DNS Server API client.
 * Uses Pi-hole's v6 REST API for DNS management.
 *
 * Interface matches technitium.js so the dns-adapter can swap them.
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
  if (sid) { headers['Cookie'] = `sid=${sid}`; headers['X-FTL-SID'] = sid }

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

// ── Device Discovery ─────────────────────────────────────────────

export async function getDhcpLeases() {
  // Pi-hole v6: /api/clients returns MAC addresses + comments
  try {
    const data = await piholeRequest('GET', '/clients')
    const entries = data?.clients || []
    return entries.map(e => ({
      hardwareAddress: e.client || '',
      ipAddress: '',
      hostName: e.comment || e.name || 'Unknown',
      leaseExpires: 1,
    }))
  } catch {}
  // Fallback: /api/network/devices
  try {
    const data = await piholeRequest('GET', '/network/devices')
    const entries = data?.devices || []
    return entries.map(e => ({
      hardwareAddress: e.hwaddr || '',
      ipAddress: e.ip || '',
      hostName: e.name || 'Unknown',
      leaseExpires: 1,
    }))
  } catch {}
  // Final: /api/stats/top_clients
  try {
    const data = await piholeRequest('GET', '/stats/top_clients')
    const clients = data?.top_clients || []
    return clients.map(c => ({
      hardwareAddress: '',
      ipAddress: c.ip || '',
      hostName: c.name || c.ip || 'Unknown',
      leaseExpires: 1,
    }))
  } catch { return [] }
}

// ── Domain Blocking ──────────────────────────────────────────────

export async function blockDomain(domain) {
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
      return { technitium: true, needsAuth: true }
    } finally { clearTimeout(timeoutId) }
  } catch (e) {
    console.log('[PIHOLE HEALTH] Error:', e.message)
    return { technitium: false }
  }
}