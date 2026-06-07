import { Router } from 'express'
import { getDb } from '../lib/db.js'

const router = Router()

// GET /api/profiles/:profileId/rules - List all rules for a profile
router.get('/profiles/:profileId/rules', (req, res, next) => {
  try {
    const db = getDb()
    const rules = db.prepare('SELECT * FROM rules WHERE profile_id = ? ORDER BY priority ASC').all(req.params.profileId)
    res.json(rules.map(r => ({
      ...r,
      days: JSON.parse(r.days),
      enabled: !!r.enabled
    })))
  } catch (e) {
    next(e)
  }
})

// POST /api/profiles/:profileId/rules - Create a new rule
router.post('/profiles/:profileId/rules', (req, res, next) => {
  try {
    const db = getDb()
    const { name, days, access_start, access_end, enabled, priority } = req.body
    const result = db.prepare(`
      INSERT INTO rules (profile_id, name, days, access_start, access_end, enabled, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.profileId,
      name || 'New rule',
      JSON.stringify(days || [1, 2, 3, 4, 5]),
      access_start || '07:00',
      access_end || '21:00',
      enabled !== false ? 1 : 0,
      priority || 10
    )
    res.status(201).json({
      id: result.lastInsertRowid,
      profile_id: req.params.profileId,
      name: name || 'New rule',
      days: days || [1, 2, 3, 4, 5],
      access_start: access_start || '07:00',
      access_end: access_end || '21:00',
      enabled: enabled !== false,
      priority: priority || 10
    })
  } catch (e) {
    next(e)
  }
})

// PUT /api/rules/:id - Update a rule
router.put('/rules/:id', (req, res, next) => {
  try {
    const db = getDb()
    const { name, days, access_start, access_end, enabled, priority } = req.body
    db.prepare(`
      UPDATE rules SET
        name = ?, days = ?, access_start = ?, access_end = ?,
        enabled = ?, priority = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name, JSON.stringify(days), access_start, access_end,
      enabled ? 1 : 0, priority, req.params.id
    )
    res.json({ id: Number(req.params.id), ...req.body, updated: true })
  } catch (e) {
    next(e)
  }
})

// DELETE /api/rules/:id - Delete a rule
router.delete('/rules/:id', (req, res, next) => {
  try {
    const db = getDb()
    db.prepare('DELETE FROM rules WHERE id = ?').run(req.params.id)
    res.json({ deleted: true })
  } catch (e) {
    next(e)
  }
})

export default router