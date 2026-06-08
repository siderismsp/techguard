/**
 * Technitium DNS Server API client.
 * Reads connection settings from environment or saved settings.
 */

import { getDb } from './db.js'

let TECHNITIUM_URL = process.env.TECHNITIUM_URL || 'http://localhost:5380'
let TECHNITIUM_API_KEY = process.env.TECHNITIUM_API_KEY || ''

// Default timeout for Technitium API calls (5 seconds)
const TECHNITIUM_TIMEOUT_MS = parseInt(process.env.TECHNITIUM_TIMEOUT_MS || '5000', 10)

export async function configureFromSettings() {
  try {
    const db = getDb()
    db.exec(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )`)
    const url = db.prepare("SELECT value FROM settings WHERE key = 'technitium_url'").get()
    const key = db.prepare("SELECT value FROM settings WHERE key = 'technitium_api_key'").get()
    if (url) TECHNITIUM_URL = url.value
    if (key) TECHNITIUM_API_KEY = key.value
    console.log(`[TECHNITIUM] Configured: ${TECHNITIUM_URL}`)
  } catch {}
}

export function getTechnitiumConfig() {
  return { url: TECHNITIUM_URL, apiKey: TECHNITIUM_API_KEY ? '***' : '(none)' }
}

async function technitiumRequest(path, params = {}) {
  const url = new URL(`${TECHNITIUM_URL}/api/${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }

  const headers = {}
  if (TECHNITIUM_API_KEY) {
    headers['Authorization'] = `Bearer ${TECHNITIUM_API_KEY}`
  }

  // Create an AbortController with a timeout to prevent hanging requests
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TECHNITIUM_TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), { headers, signal: controller.signal })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Technitium API error ${res.status}: ${text}`)
    }

    const data = await res.json()
    if (data.status === 'error') {
      throw new Error(`Technitium error: ${data.errorMessage} ${data.innerErrorMessage || ''}`)
    }
    if (data.status === 'invalid-token') {
      throw new Error('Technitium session expired')
    }

    return data
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getDhcpLeases() {
  const data = await technitiumRequest('dhcp/leases/get')
  return data.leases || []
}

export async function blockDomain(domain) {
  return technitiumRequest('dns/blocked/block', { domain })
}

export async function unblockDomain(domain) {
  return technitiumRequest('dns/blocked/unblock', { domain })
}

export async function listBlockedDomains() {
  const data = await technitiumRequest('dns/blocked/list')
  return data.blockedDomains || []
}

export async function addAllowedZone(domain) {
  return technitiumRequest('dns/allow/allow', { domain })
}

export async function removeAllowedZone(domain) {
  return technitiumRequest('dns/allow/remove', { domain })
}

export async function getContentFilteringStatus() {
  const data = await technitiumRequest('dns/blocking')
  return {
    enabled: data.enabled || false,
    categories: data.categories || [],
    blockLists: data.blockLists || []
  }
}

export async function setContentFiltering(enabled) {
  return technitiumRequest('dns/blocking', { enable: enabled ? 'true' : 'false' })
}

export async function setForwarder(forwarder) {
  return technitiumRequest('dns/forwarder', { forwarder })
}

export async function getConfig() {
  return technitiumRequest('dns/config')
}

export async function getBlockLists() {
  const data = await technitiumRequest('dns/blockLists/list')
  return data.blockLists || []
}

export async function enableBlockList(id, enable) {
  return technitiumRequest('dns/blockLists/enable', { id, enable: enable ? 'true' : 'false' })
}

export async function updateBlockLists() {
  return technitiumRequest('dns/blockLists/update')
}

export async function getHealth() {
  try {
    await technitiumRequest('dns/config')
    return { technitium: true }
  } catch (e) {
    // If we got a response from Technitium (even invalid-token), it's reachable
    if (e.message && e.message.includes('Technitium session expired')) {
      return { technitium: true, needsAuth: true }
    }
    return { technitium: false }
  }
}
