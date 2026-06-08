import { Router } from 'express'
import { getDb } from '../lib/db.js'

const router = Router()

// GET /api/parental/filters - Get all content filters
router.get('/parental/filters', (req, res, next) => {
  try {
    const db = getDb()
    const filters = db.prepare('SELECT * FROM content_filters ORDER BY category').all()
    res.json(filters.map(f => ({ ...f, enabled: !!f.enabled })))
  } catch (e) {
    next(e)
  }
})

// PUT /api/parental/filters/:id - Update a content filter
router.put('/parental/filters/:id', async (req, res, next) => {
  try {
    const db = getDb()
    const { action, enabled } = req.body

    let filter = db.prepare('SELECT * FROM content_filters WHERE id = ?').get(req.params.id)

    if (filter) {
      db.prepare(`
        UPDATE content_filters SET action = ?, enabled = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(action || 'allow', enabled ? 1 : 0, req.params.id)
    } else {
      const parts = req.params.id.split('_')
      const profileId = parts[0]
      const category = parts.slice(1).join('_')
      db.prepare(`
        INSERT INTO content_filters (id, profile_id, category, action, enabled)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.params.id, profileId, category, action || 'allow', enabled ? 1 : 0)
    }

    // Try to sync with DNS provider
    try {
      const { getDnsProvider } = await import('../lib/dns-adapter.js')
      const { module } = await getDnsProvider()
      const anyEnabled = db.prepare('SELECT COUNT(*) as c FROM content_filters WHERE enabled = 1').get()
      if (module.setContentFiltering) {
        await module.setContentFiltering(anyEnabled.c > 0)
      }
    } catch {}

    res.json({ id: req.params.id, action, enabled, updated: true })
  } catch (e) {
    next(e)
  }
})

// GET /api/parental/blocklists - Get block list status
router.get('/parental/blocklists', async (req, res, next) => {
  try {
    const { getDnsProvider } = await import('../lib/dns-adapter.js')
    const { module } = await getDnsProvider()
    const lists = await module.getBlockLists()
    res.json(lists)
  } catch {
    res.json([
      { id: 'oisd', name: 'OISD Big', enabled: true, entries: 1250000 },
      { id: 'stevenblack', name: 'StevenBlack Unified', enabled: true, entries: 78000 },
      { id: 'noads', name: 'NoAds Safe', enabled: false, entries: 42000 },
    ])
  }
})

// PUT /api/parental/blocklists/:id - Toggle a block list
router.put('/parental/blocklists/:id', async (req, res, next) => {
  try {
    const { getDnsProvider } = await import('../lib/dns-adapter.js')
    const { module } = await getDnsProvider()
    const { enabled } = req.body
    if (module.enableBlockList) {
      await module.enableBlockList(req.params.id, enabled)
    }
    if (enabled && module.updateBlockLists) {
      await module.updateBlockLists()
    }
    res.json({ id: req.params.id, enabled, updated: true })
  } catch (e) {
    next(e)
  }
})

export default router