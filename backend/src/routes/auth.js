import { Router } from 'express'
import { login, destroySession, validateSession, isAuthConfigured, setAdminPassword, setAdminUsername, getAdminUsername } from '../lib/auth.js'

const router = Router()

// POST /api/auth/login
router.post('/auth/login', (req, res, next) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }
    const token = login(username, password)
    // Set cookie
    res.cookie('techguard_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24h
      path: '/'
    })
    res.json({ token, username, expiresIn: 86400 })
  } catch (e) {
    if (e.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    next(e)
  }
})

// POST /api/auth/logout
router.post('/auth/logout', (req, res, next) => {
  try {
    const token = req.cookies?.techguard_session ||
                  req.headers['authorization']?.replace('Bearer ', '')
    if (token) destroySession(token)
    res.clearCookie('techguard_session', { path: '/' })
    res.json({ loggedOut: true })
  } catch (e) {
    next(e)
  }
})

// GET /api/auth/status - Check if logged in
router.get('/auth/status', (req, res, next) => {
  try {
    const token = req.cookies?.techguard_session ||
                  req.headers['authorization']?.replace('Bearer ', '')
    const session = validateSession(token)
    res.json({
      authenticated: !!session,
      username: session?.username || null,
      authConfigured: isAuthConfigured()
    })
  } catch {
    res.json({ authenticated: false, username: null, authConfigured: isAuthConfigured() })
  }
})

// POST /api/auth/setup - Create initial admin account (only if not configured)
router.post('/auth/setup', (req, res, next) => {
  try {
    if (isAuthConfigured()) {
      return res.status(400).json({ error: 'Admin account already configured' })
    }
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' })
    }
    setAdminUsername(username)
    setAdminPassword(password)

    // Auto-login after setup
    const token = login(username, password)
    res.cookie('techguard_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    })
    res.json({ token, username, configured: true })
  } catch (e) {
    next(e)
  }
})

export default router