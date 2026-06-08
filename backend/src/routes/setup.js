/**
 * Setup & Provider Detection Routes
 * Used by the initial setup wizard to detect and configure DNS providers.
 */

import { Router } from 'express'
const router = Router()

// GET /api/setup/status - Check if setup is complete
router.get('/setup/status', async (req, res, next) => {
  try {
    const { getDnsProvider } = await import('../lib/dns-adapter.js')
    const { getDb } = await import('../lib/db.js')
    const db = getDb()

    // Check if setup has been completed
    const setupDone = db.prepare("SELECT value FROM settings WHERE key = 'dns_provider'").get()

    // Check if provider credentials are saved
    const technitiumKey = db.prepare("SELECT value FROM settings WHERE key = 'technitium_api_key'").get()
    const piholePw = db.prepare("SELECT value FROM settings WHERE key = 'pihole_password'").get()
    const technitiumUrl = db.prepare("SELECT value FROM settings WHERE key = 'technitium_url'").get()
    const piholeUrl = db.prepare("SELECT value FROM settings WHERE key = 'pihole_url'").get()

    res.json({
      configured: !!setupDone,
      provider: setupDone?.value || null,
      hasCredentials: !!(technitiumKey || piholePw)
    })
  } catch (e) {
    next(e)
  }
})

// GET /api/setup/detect - Auto-detect DNS servers on the network
router.get('/setup/detect', async (req, res, next) => {
  try {
    const { detectDnsServers } = await import('../lib/dns-adapter.js')
    const servers = await detectDnsServers()
    res.json({ servers })
  } catch (e) {
    res.json({ servers: [] })
  }
})

// POST /api/setup/provider - Set the DNS provider
router.post('/setup/provider', async (req, res, next) => {
  try {
    const { setDnsProvider } = await import('../lib/dns-adapter.js')
    const { provider } = req.body

    if (!provider || !['technitium', 'pihole'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider. Must be "technitium" or "pihole".' })
    }

    const result = await setDnsProvider(provider)
    res.json({ provider: result.name, configured: true })
  } catch (e) {
    next(e)
  }
})

// POST /api/setup/credentials - Save provider credentials
router.post('/setup/credentials', async (req, res, next) => {
  try {
    const { getDb } = await import('../lib/db.js')
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

    const { provider, url, apiKey, password } = req.body

    if (provider === 'technitium') {
      if (url) upsert.run('technitium_url', url)
      if (apiKey !== undefined) upsert.run('technitium_api_key', apiKey)
    } else if (provider === 'pihole') {
      if (url) upsert.run('pihole_url', url)
      if (password !== undefined) upsert.run('pihole_password', password)
    }

    // Reload provider settings
    const { getDnsProvider } = await import('../lib/dns-adapter.js')
    await getDnsProvider() // This calls configureFromSettings internally

    res.json({ saved: true })
  } catch (e) {
    next(e)
  }
})

export default router