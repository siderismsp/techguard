import { Router } from 'express'
import { getDb } from '../lib/db.js'

const router = Router()

// GET /api/profiles - List all profiles
router.get('/profiles', (req, res, next) => {
  try {
    const db = getDb()
    const profiles = db.prepare('SELECT id, name, created_at FROM profiles ORDER BY id').all()
    res.json(profiles)
  } catch (e) {
    next(e)
  }
})

// POST /api/profiles - Create a new profile
router.post('/profiles', (req, res, next) => {
  try {
    const db = getDb()
    const { id, name } = req.body
    if (!id || !name) return res.status(400).json({ error: 'id and name are required' })

    db.prepare('INSERT INTO profiles (id, name) VALUES (?, ?)').run(id, name)
    res.status(201).json({ id, name, created_at: new Date().toISOString() })
  } catch (e) {
    if (e.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Profile ID already exists' })
    }
    next(e)
  }
})

// PUT /api/profiles/:id - Update a profile
router.put('/profiles/:id', (req, res, next) => {
  try {
    const db = getDb()
    const { name } = req.body
    db.prepare("UPDATE profiles SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, req.params.id)
    res.json({ id: req.params.id, name, updated: true })
  } catch (e) {
    next(e)
  }
})

// DELETE /api/profiles/:id - Delete a profile
router.delete('/profiles/:id', (req, res, next) => {
  try {
    const db = getDb()
    if (req.params.id === 'default') {
      return res.status(400).json({ error: 'Cannot delete the default profile' })
    }
    db.prepare('DELETE FROM profiles WHERE id = ?').run(req.params.id)
    res.json({ deleted: true })
  } catch (e) {
    next(e)
  }
})

export default router