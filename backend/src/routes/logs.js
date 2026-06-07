import { Router } from 'express'
import { getDb } from '../lib/db.js'
import { categorizeDomain } from '../lib/service-map.js'

const router = Router()

// POST /api/logs/ingest - Accept DNS query logs from Technitium
// Body: { logs: [{ client_ip, domain, blocked, device_mac?, device_name?, profile_id? }] }
router.post('/logs/ingest', (req, res, next) => {
  try {
    const db = getDb()
    const { logs } = req.body
    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({ error: 'logs array required' })
    }

    const insert = db.prepare(`
      INSERT INTO dns_logs (client_ip, device_mac, device_name, domain, service, category, icon, blocked, profile_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertMany = db.transaction((entries) => {
      let count = 0
      for (const entry of entries) {
        const categorized = categorizeDomain(entry.domain)
        insert.run(
          entry.client_ip || null,
          entry.device_mac || null,
          entry.device_name || null,
          entry.domain,
          categorized?.service || null,
          categorized?.category || null,
          categorized?.icon || null,
          entry.blocked ? 1 : 0,
          entry.profile_id || null
        )
        count++
      }
      return count
    })

    const inserted = insertMany(logs)

    res.status(201).json({ inserted, total: logs.length })
  } catch (e) {
    next(e)
  }
})

// GET /api/logs/activity - Get aggregated activity by service
// Query params: device_mac, profile_id, hours (default 24), limit (default 50)
router.get('/logs/activity', (req, res, next) => {
  try {
    const db = getDb()
    const { device_mac, profile_id, hours = '24', limit = '50' } = req.query

    let where = `WHERE timestamp >= datetime('now', '-${Math.max(1, parseInt(hours))} hours')`
    const params = []

    if (device_mac) {
      where += ' AND device_mac = ?'
      params.push(device_mac)
    }
    if (profile_id) {
      where += ' AND profile_id = ?'
      params.push(profile_id)
    }

    // Aggregate by service name
    const services = db.prepare(`
      SELECT 
        service,
        category,
        icon,
        COUNT(*) as hit_count,
        SUM(blocked) as blocked_count,
        MAX(timestamp) as last_seen
      FROM dns_logs
      ${where}
      GROUP BY service
      ORDER BY hit_count DESC
      LIMIT ?
    `).all(...params, parseInt(limit))

    // Get top domains overall
    const topDomains = db.prepare(`
      SELECT domain, service, category, COUNT(*) as hit_count
      FROM dns_logs
      ${where}
      GROUP BY domain
      ORDER BY hit_count DESC
      LIMIT 20
    `).all(...params)

    // Get timeline data (hits per hour)
    const timeline = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00', timestamp) as hour,
        COUNT(*) as hits,
        SUM(blocked) as blocked
      FROM dns_logs
      ${where}
      GROUP BY hour
      ORDER BY hour ASC
    `).all(...params)

    // Get unique devices
    const devices = db.prepare(`
      SELECT device_mac, device_name, COUNT(*) as hits
      FROM dns_logs
      ${where} AND device_mac IS NOT NULL
      GROUP BY device_mac
      ORDER BY hits DESC
    `).all(...params)

    // Total stats
    const total = db.prepare(`
      SELECT COUNT(*) as total, SUM(blocked) as total_blocked
      FROM dns_logs ${where}
    `).get(...params)

    res.json({
      services,
      topDomains,
      timeline,
      devices,
      summary: {
        total: total.total || 0,
        totalBlocked: total.total_blocked || 0,
        uniqueServices: services.length,
        period: `${hours}h`
      }
    })
  } catch (e) {
    next(e)
  }
})

// GET /api/logs/recent - Get recent raw log entries
router.get('/logs/recent', (req, res, next) => {
  try {
    const db = getDb()
    const { limit = '50', device_mac } = req.query

    let where = ''
    const params = []
    if (device_mac) {
      where = 'WHERE device_mac = ?'
      params.push(device_mac)
    }

    const entries = db.prepare(`
      SELECT * FROM dns_logs ${where}
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(...params, parseInt(limit))

    res.json(entries)
  } catch (e) {
    next(e)
  }
})

// DELETE /api/logs/purge - Delete logs older than N days
router.delete('/logs/purge', (req, res, next) => {
  try {
    const db = getDb()
    const { days = '30' } = req.query
    const result = db.prepare(`
      DELETE FROM dns_logs WHERE timestamp < datetime('now', '-${parseInt(days)} days')
    `).run()
    res.json({ deleted: result.changes })
  } catch (e) {
    next(e)
  }
})

export default router