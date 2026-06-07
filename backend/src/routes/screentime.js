import { Router } from 'express'
import { getDb } from '../lib/db.js'

const router = Router()

// GET /api/screentime/budgets - Get all screen time budgets
router.get('/screentime/budgets', (req, res, next) => {
  try {
    const db = getDb()
    const budgets = db.prepare(`
      SELECT sb.*, p.name as profile_name
      FROM screen_time_budgets sb
      JOIN profiles p ON p.id = sb.profile_id
      ORDER BY p.name
    `).all()
    res.json(budgets.map(b => ({ ...b, enabled: !!b.enabled })))
  } catch (e) {
    next(e)
  }
})

// GET /api/screentime/budgets/:profileId - Get budget for a profile
router.get('/screentime/budgets/:profileId', (req, res, next) => {
  try {
    const db = getDb()
    let budget = db.prepare('SELECT * FROM screen_time_budgets WHERE profile_id = ?').get(req.params.profileId)
    if (!budget) {
      budget = { profile_id: req.params.profileId, daily_minutes: 120, enabled: false, reset_hour: 0 }
    }
    res.json({ ...budget, enabled: !!budget.enabled })
  } catch (e) {
    next(e)
  }
})

// PUT /api/screentime/budgets/:profileId - Create or update budget
router.put('/screentime/budgets/:profileId', (req, res, next) => {
  try {
    const db = getDb()
    const { daily_minutes, enabled, reset_hour } = req.body

    db.prepare(`
      INSERT INTO screen_time_budgets (profile_id, daily_minutes, enabled, reset_hour, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(profile_id) DO UPDATE SET
        daily_minutes = excluded.daily_minutes,
        enabled = excluded.enabled,
        reset_hour = excluded.reset_hour,
        updated_at = datetime('now')
    `).run(
      req.params.profileId,
      daily_minutes || 120,
      enabled ? 1 : 0,
      reset_hour !== undefined ? reset_hour : 0
    )

    res.json({
      profile_id: req.params.profileId,
      daily_minutes: daily_minutes || 120,
      enabled: !!enabled,
      reset_hour: reset_hour || 0,
      updated: true
    })
  } catch (e) {
    next(e)
  }
})

// GET /api/screentime/usage/:profileId/:deviceMac? - Get current usage
router.get('/screentime/usage/:profileId/:deviceMac?', (req, res, next) => {
  try {
    const db = getDb()
    const today = new Date().toISOString().slice(0, 10)

    let usage
    if (req.params.deviceMac) {
      usage = db.prepare(`
        SELECT * FROM daily_usage
        WHERE profile_id = ? AND device_mac = ? AND date = ?
      `).get(req.params.profileId, req.params.deviceMac, today)
    } else {
      // Aggregate all devices for this profile today
      usage = db.prepare(`
        SELECT profile_id, date, SUM(minutes_used) as minutes_used
        FROM daily_usage
        WHERE profile_id = ? AND date = ?
        GROUP BY profile_id, date
      `).get(req.params.profileId, today)
    }

    // Get the budget
    const budget = db.prepare('SELECT * FROM screen_time_budgets WHERE profile_id = ?').get(req.params.profileId)

    res.json({
      profile_id: req.params.profileId,
      device_mac: req.params.deviceMac || null,
      date: today,
      minutesUsed: usage?.minutes_used || 0,
      budgetMinutes: budget?.daily_minutes || 120,
      budgetEnabled: budget ? !!budget.enabled : false,
      remaining: budget?.enabled
        ? Math.max(0, (budget.daily_minutes || 120) - (usage?.minutes_used || 0))
        : null,
      exhausted: budget?.enabled
        ? (usage?.minutes_used || 0) >= (budget.daily_minutes || 120)
        : false
    })
  } catch (e) {
    next(e)
  }
})

// POST /api/screentime/track - Track screen time usage
// Body: { profile_id, device_mac, minutes }
router.post('/screentime/track', (req, res, next) => {
  try {
    const db = getDb()
    const { profile_id, device_mac, minutes } = req.body
    if (!profile_id || !device_mac || minutes === undefined) {
      return res.status(400).json({ error: 'profile_id, device_mac, and minutes required' })
    }

    const today = new Date().toISOString().slice(0, 10)

    db.prepare(`
      INSERT INTO daily_usage (profile_id, device_mac, date, minutes_used, last_updated)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(profile_id, device_mac, date) DO UPDATE SET
        minutes_used = minutes_used + excluded.minutes_used,
        last_updated = datetime('now')
    `).run(profile_id, device_mac, today, Math.max(0, minutes))

    // Check if budget is now exhausted
    const budget = db.prepare('SELECT * FROM screen_time_budgets WHERE profile_id = ? AND enabled = 1').get(profile_id)
    let exhausted = false
    if (budget) {
      const total = db.prepare(`
        SELECT SUM(minutes_used) as total FROM daily_usage
        WHERE profile_id = ? AND date = ?
      `).get(profile_id, today)
      exhausted = (total?.total || 0) >= budget.daily_minutes
    }

    res.json({
      profile_id,
      device_mac,
      date: today,
      tracked: true,
      exhausted
    })
  } catch (e) {
    next(e)
  }
})

// GET /api/screentime/status/:profileId - Get full status for a profile
router.get('/screentime/status/:profileId', (req, res, next) => {
  try {
    const db = getDb()
    const today = new Date().toISOString().slice(0, 10)

    const budget = db.prepare('SELECT * FROM screen_time_budgets WHERE profile_id = ?').get(req.params.profileId)
    const devices = db.prepare(`
      SELECT device_mac, SUM(minutes_used) as minutes_used
      FROM daily_usage
      WHERE profile_id = ? AND date = ?
      GROUP BY device_mac
    `).all(req.params.profileId, today)

    const totalMinutes = devices.reduce((sum, d) => sum + d.minutes_used, 0)

    res.json({
      profile_id: req.params.profileId,
      date: today,
      budget: budget ? {
        dailyMinutes: budget.daily_minutes,
        enabled: !!budget.enabled,
        resetHour: budget.reset_hour
      } : null,
      devices,
      totalMinutes,
      remaining: budget?.enabled ? Math.max(0, budget.daily_minutes - totalMinutes) : null,
      exhausted: budget?.enabled ? totalMinutes >= budget.daily_minutes : false
    })
  } catch (e) {
    next(e)
  }
})

export default router