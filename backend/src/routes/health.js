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
      timestamp: new Date().toISOString()
    })
  } catch {
    res.json({
      status: 'ok',
      technitium: false,
      timestamp: new Date().toISOString()
    })
  }
})

export default router