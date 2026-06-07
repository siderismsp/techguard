import { Router } from 'express'
import { getDb } from '../lib/db.js'

const router = Router()

// GET /api/settings - Get all settings
router.get('/settings', (req, res, next) => {
  try {
    const db = getDb()
    db.exec(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )`)

    const rows = db.prepare('SELECT key, value FROM settings').all()
    const settings = {}
    for (const r of rows) settings[r.key] = r.value
    res.json(settings)
  } catch (e) {
    next(e)
  }
})

// PUT /api/settings - Update settings
router.put('/settings', (req, res, next) => {
  try {
    const db = getDb()
    db.exec(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )`)

    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `)

    const { technitium_url, technitium_api_key } = req.body
    const updateMany = db.transaction((entries) => {
      for (const [key, value] of Object.entries(entries)) {
        upsert.run(key, String(value))
      }
    })

    const updates = {}
    if (technitium_url !== undefined) updates.technitium_url = technitium_url
    if (technitium_api_key !== undefined) updates.technitium_api_key = technitium_api_key
    updateMany(updates)

    res.json({ updated: true, ...updates })
  } catch (e) {
    next(e)
  }
})

export default router