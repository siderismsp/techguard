import { Router } from 'express'
import { getDb } from '../lib/db.js'
import { evaluateDeviceAccess } from '../enforcer.js'

const router = Router()

// GET /api/devices - List all devices with enforcement status
router.get('/devices', async (req, res, next) => {
  try {
    let leases = []
    try {
      const { getDnsProvider } = await import('../lib/dns-adapter.js')
      const { module } = await getDnsProvider()
      leases = await module.getDhcpLeases()
    } catch {
      // DNS provider unavailable
    }

    const db = getDb()

    // Get stored device configs
    const configs = {}
    try {
      db.exec(`CREATE TABLE IF NOT EXISTS device_config (
        mac TEXT PRIMARY KEY,
        name TEXT,
        profile_id TEXT,
        static_ip TEXT,
        notes TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      )`)
      const rows = db.prepare('SELECT * FROM device_config').all()
      for (const r of rows) configs[r.mac] = r
    } catch {}

    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const currentDay = now.getDay()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const devices = leases.map(lease => {
      const mac = lease.hardwareAddress || ''
      const cfg = configs[mac] || {}
      const profileId = cfg.profile_id || 'default'

      // Evaluate current access for this device
      const access = evaluateDeviceAccess(profileId, currentDay, currentTime, today, db)

      return {
        mac,
        name: cfg.name || lease.hostName || 'Unknown Device',
        ip: lease.ipAddress || '',
        online: lease.leaseExpires > 0,
        profile: profileId,
        static_ip: cfg.static_ip || null,
        notes: cfg.notes || '',
        hasAccess: access.allowed,
        restriction: access.reason || null,
      }
    })
    res.json(devices)
  } catch (e) {
    next(e)
  }
})

// PUT /api/devices/:mac - Update device metadata
router.put('/devices/:mac', (req, res, next) => {
  try {
    const db = getDb()
    const { name, profile, static_ip, notes } = req.body

    db.exec(`CREATE TABLE IF NOT EXISTS device_config (
      mac TEXT PRIMARY KEY,
      name TEXT,
      profile_id TEXT,
      static_ip TEXT,
      notes TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )`)

    db.prepare(`
      INSERT OR REPLACE INTO device_config (mac, name, profile_id, static_ip, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(req.params.mac, name || null, profile || null, static_ip || null, notes || null)

    res.json({
      mac: req.params.mac,
      name,
      profile,
      static_ip,
      notes,
      updated: true
    })
  } catch (e) {
    next(e)
  }
})

// GET /api/enforcement/status - Get current enforcement state
router.get('/enforcement/status', (req, res, next) => {
  try {
    const db = getDb()
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const currentDay = now.getDay()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const profiles = db.prepare('SELECT id, name FROM profiles').all()
    const status = profiles.map(p => {
      const access = evaluateDeviceAccess(p.id, currentDay, currentTime, today, db)

      // Get count of devices on this profile
      let deviceCount = 0
      try {
        const count = db.prepare('SELECT COUNT(*) as c FROM device_config WHERE profile_id = ?').get(p.id)
        deviceCount = count?.c || 0
      } catch {}

      return {
        profileId: p.id,
        profileName: p.name,
        allowed: access.allowed,
        reason: access.reason,
        deviceCount,
        checkedAt: now.toISOString()
      }
    })

    res.json({
      timestamp: now.toISOString(),
      profiles: status,
      restrictedCount: status.filter(s => !s.allowed).length
    })
  } catch (e) {
    next(e)
  }
})

export default router