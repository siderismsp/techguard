import { Router } from 'express'
import { getDb } from '../lib/db.js'

const router = Router()

// GET /api/profiles/:profileId/overrides?year=2026&month=6
router.get('/profiles/:profileId/overrides', (req, res, next) => {
  try {
    const db = getDb()
    const { year, month } = req.query
    const prefix = `${year}-${String(Number(month)).padStart(2, '0')}`
    const overrides = db.prepare(
      'SELECT date, type FROM overrides WHERE profile_id = ? AND date LIKE ?'
    ).all(req.params.profileId, `${prefix}%`)
    res.json(overrides)
  } catch (e) {
    next(e)
  }
})

// POST /api/profiles/:profileId/overrides
router.post('/profiles/:profileId/overrides', (req, res, next) => {
  try {
    const db = getDb()
    const { date, type } = req.body
    if (!date || !type) return res.status(400).json({ error: 'date and type required' })

    db.prepare(`
      INSERT OR REPLACE INTO overrides (profile_id, date, type)
      VALUES (?, ?, ?)
    `).run(req.params.profileId, date, type)

    res.status(201).json({ date, type, profile_id: req.params.profileId })
  } catch (e) {
    next(e)
  }
})

// DELETE /api/profiles/:profileId/overrides/:date
router.delete('/profiles/:profileId/overrides/:date', (req, res, next) => {
  try {
    const db = getDb()
    db.prepare('DELETE FROM overrides WHERE profile_id = ? AND date = ?')
      .run(req.params.profileId, req.params.date)
    res.json({ deleted: true })
  } catch (e) {
    next(e)
  }
})

export default router