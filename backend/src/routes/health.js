import { Router } from 'express'

const router = Router()

// GET /api/health
router.get('/health', async (req, res) => {
  try {
    const { getDnsProvider } = await import('../lib/dns-adapter.js')
    const { name, module } = await getDnsProvider()
    const health = await module.getHealth()
    res.json({
      status: 'ok',
      technitium: health.technitium,
      needsAuth: health.needsAuth || false,
      provider: name,
      timestamp: new Date().toISOString()
    })
  } catch {
    res.json({
      status: 'ok',
      technitium: false,
      needsAuth: false,
      provider: 'unknown',
      timestamp: new Date().toISOString()
    })
  }
})

export default router