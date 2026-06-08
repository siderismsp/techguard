import { Router } from 'express'
import { getHealth } from '../lib/technitium.js'

const router = Router()

// GET /api/health
router.get('/health', async (req, res) => {
  try {
    const health = await getHealth()
    res.json({
      status: 'ok',
      technitium: health.technitium,
      needsAuth: health.needsAuth || false,
      timestamp: new Date().toISOString()
    })
  } catch {
    res.json({
      status: 'ok',
      technitium: false,
      needsAuth: false,
      timestamp: new Date().toISOString()
    })
  }
})

export default router