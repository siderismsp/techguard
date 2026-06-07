/**
 * Technitium DNS Server API client.
 * Maps TechGuard's high-level operations to Technitium REST API calls.
 * Docs: https://github.com/TechnitiumSoftware/DnsServer/blob/master/APIDOCS.md
 */

const TECHNITIUM_URL = process.env.TECHNITIUM_URL || 'http://localhost:5380'
const TECHNITIUM_API_KEY = process.env.TECHNITIUM_API_KEY || ''

let sessionToken = null
let sessionExpires = 0

async function technitiumRequest(path, params = {}) {
  // Build URL with query params
  const url = new URL(`${TECHNITIUM_URL}/api/${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }

  const headers = {}
  if (TECHNITIUM_API_KEY) {
    headers['Authorization'] = `Bearer ${TECHNITIUM_API_KEY}`
  } else if (sessionToken && Date.now() < sessionExpires) {
    headers['Authorization'] = `Bearer ${sessionToken}`
  }

  const res = await fetch(url.toString(), { headers })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Technitium API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  if (data.status === 'error') {
    throw new Error(`Technitium error: ${data.errorMessage} ${data.innerErrorMessage || ''}`)
  }
  if (data.status === 'invalid-token') {
    sessionToken = null
    throw new Error('Technitium session expired')
  }

  return data
}

// ───── Device Management ─────

export async function getDhcpLeases() {
  const data = await technitiumRequest('dhcp/leases/get')
  // Returns: { status: 'ok', leases: [{ hostName, hardwareAddress, ipAddress, leaseExpires, ... }] }
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

// ───── Allowed / Blocked Zones ─────

export async function addAllowedZone(domain) {
  return technitiumRequest('dns/allow/allow', { domain })
}

export async function removeAllowedZone(domain) {
  return technitiumRequest('dns/allow/remove', { domain })
}

// ───── Content Filtering (Category Blocking) ─────

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

// ───── DNS Configuration ─────

export async function setForwarder(forwarder) {
  return technitiumRequest('dns/forwarder', { forwarder })
}

export async function getConfig() {
  return technitiumRequest('dns/config')
}

// ───── Block Lists ─────

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

// ───── Health ─────

export async function getHealth() {
  try {
    await technitiumRequest('dns/config')
    return { technitium: true }
  } catch {
    return { technitium: false }
  }
}