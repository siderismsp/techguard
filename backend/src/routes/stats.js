import { Router } from 'express'
import { getDb } from '../lib/db.js'
import { getDhcpLeases } from '../lib/technitium.js'

const router = Router()

// GET /api/stats
router.get('/stats', async (req, res, next) => {
  try {
    const db = getDb()

    let onlineCount = 0
    let totalLeases = 0
    try {
      const leases = await getDhcpLeases()
      onlineCount = leases.filter(l => l.leaseExpires > 0).length
      totalLeases = leases.length
    } catch {}

    const rulesCount = db.prepare('SELECT COUNT(*) as c FROM rules').get().c
    const profilesCount = db.prepare('SELECT COUNT(*) as c FROM profiles').get().c
    const activeFilters = db.prepare('SELECT COUNT(*) as c FROM content_filters WHERE enabled = 1').get().c
    const today = new Date().toISOString().slice(0, 10)
    const todayOverrides = db.prepare('SELECT COUNT(*) as c FROM overrides WHERE date = ?').get(today).c

    res.json({
      devices: { online: onlineCount, total: totalLeases },
      rules: rulesCount,
      profiles: profilesCount,
      activeFilters,
      todayOverrides
    })
  } catch (e) {
    next(e)
  }
})

export default router