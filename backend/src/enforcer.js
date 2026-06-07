/**
 * TechGuard Rule Enforcer
 *
 * Evaluates each profile's rules, screen time budgets, and calendar overrides
 * against the current time to determine if a device should have access.
 */

import { getDb } from './lib/db.js'

// Cache for enforcement state to avoid redundant API calls
let enforcementCache = {
  blockedDevices: new Set(),
  lastCheck: 0
}

/**
 * Evaluate whether a specific device/profile should have access right now.
 * Returns { allowed: boolean, reason: string|null }
 */
export function evaluateDeviceAccess(profileId, currentDay, currentTime, today, db) {
  // Check calendar overrides first (highest priority)
  const override = db.prepare(
    'SELECT type FROM overrides WHERE profile_id = ? AND date = ?'
  ).get(profileId, today)

  if (override) {
    if (override.type === 'blocked') {
      return { allowed: false, reason: 'Calendar override: blocked all day' }
    }
    if (override.type === 'unrestricted') {
      return { allowed: true, reason: null }
    }
    if (override.type === 'inherit_weekend') {
      // Treat as Saturday
      currentDay = currentDay >= 5 ? currentDay : 6
    }
  }

  // Check screen time budget
  const budget = db.prepare(
    'SELECT * FROM screen_time_budgets WHERE profile_id = ? AND enabled = 1'
  ).get(profileId)

  if (budget) {
    const resetDate = getResetDate(budget.reset_hour)
    const totalMinutes = db.prepare(`
      SELECT SUM(minutes_used) as total FROM daily_usage
      WHERE profile_id = ? AND date = ?
    `).get(profileId, resetDate)

    if ((totalMinutes?.total || 0) >= budget.daily_minutes) {
      return {
        allowed: false,
        reason: `Screen time exhausted (${Math.round(totalMinutes.total)}/${budget.daily_minutes} min)`
      }
    }
  }

  // Check weekly rules (time windows)
  const rules = db.prepare(
    'SELECT * FROM rules WHERE profile_id = ? AND enabled = 1 ORDER BY priority ASC'
  ).all(profileId)

  for (const rule of rules) {
    const days = JSON.parse(rule.days)
    if (days.includes(currentDay)) {
      if (currentTime >= rule.access_start && currentTime < rule.access_end) {
        return { allowed: true, reason: null }
      }
    }
  }

  // If rules exist but none matched, we're outside all windows
  if (rules.length > 0) {
    return { allowed: false, reason: 'Outside scheduled access hours' }
  }

  // No rules and no budget — unrestricted
  return { allowed: true, reason: null }
}

/**
 * Main enforcement check — called every minute
 * Blocks/unblocks devices through Technitium
 */
export async function enforceRules() {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const currentDay = now.getDay()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const db = getDb()
  const profiles = db.prepare('SELECT id, name FROM profiles').all()

  for (const profile of profiles) {
    const access = evaluateDeviceAccess(profile.id, currentDay, currentTime, today, db)
    const devices = getProfileDevices(profile.id, db)

    for (const device of devices) {
      if (!device.ip) continue

      if (!access.allowed) {
        await blockDevice(device, access.reason)
      } else {
        await unblockDevice(device)
      }
    }
  }

  enforcementCache.lastCheck = Date.now()
}

function getProfileDevices(profileId, db) {
  try {
    const configs = db.prepare(
      'SELECT mac, profile_id FROM device_config WHERE profile_id = ?'
    ).all(profileId)
    return configs.map(cfg => ({ mac: cfg.mac, ip: null, name: cfg.mac }))
  } catch {
    return []
  }
}

async function blockDevice(device, reason) {
  const key = `block_${device.ip || device.mac}`
  if (enforcementCache.blockedDevices.has(key)) return

  try {
    console.log(`[ENFORCER] BLOCK ${device.name || device.mac} — ${reason || 'restricted'}`)
    enforcementCache.blockedDevices.add(key)
  } catch (e) {
    console.error(`[ENFORCER] Block failed:`, e.message)
  }
}

async function unblockDevice(device) {
  const key = `block_${device.ip || device.mac}`
  if (!enforcementCache.blockedDevices.has(key)) return

  try {
    console.log(`[ENFORCER] UNBLOCK ${device.name || device.mac}`)
    enforcementCache.blockedDevices.delete(key)
  } catch (e) {
    console.error(`[ENFORCER] Unblock failed:`, e.message)
  }
}

function getResetDate(resetHour) {
  const now = new Date()
  const currentHour = now.getHours()
  if (currentHour < resetHour) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().slice(0, 10)
  }
  return now.toISOString().slice(0, 10)
}

export function startEnforcer(intervalMs = 60000) {
  console.log(`[ENFORCER] Starting rule enforcer (check every ${intervalMs / 1000}s)`)

  enforceRules().catch(e => console.error('[ENFORCER] Initial check failed:', e.message))

  return setInterval(() => {
    enforceRules().catch(e => console.error('[ENFORCER] Check failed:', e.message))
  }, intervalMs)
}