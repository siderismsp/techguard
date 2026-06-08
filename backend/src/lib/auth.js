/**
 * Simple session-based authentication for TechGuard.
 * Uses a token stored in the settings DB.
 */

import crypto from 'crypto'
import { getDb } from './db.js'

const SESSION_COOKIE = 'techguard_session'
const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// In-memory session cache
const sessions = new Map()

function getSettingsDb() {
  const db = getDb()
  db.exec(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  )`)
  return db
}

/**
 * Hash a password with a random salt using SHA-256.
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.createHash('sha256').update(salt + password).digest('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against a stored hash.
 */
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  const check = crypto.createHash('sha256').update(salt + password).digest('hex')
  return hash === check
}

/**
 * Check if any admin credentials have been set up.
 */
export function isAuthConfigured() {
  try {
    const db = getSettingsDb()
    const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_password_hash'").get()
    return !!row
  } catch { return false }
}

/**
 * Set the admin password (first-time setup or change).
 */
export function setAdminPassword(password) {
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters')
  }
  const db = getSettingsDb()
  const hash = hashPassword(password)
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES ('admin_password_hash', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(hash)
}

/**
 * Set the admin username.
 */
export function setAdminUsername(username) {
  if (!username || username.length < 1) throw new Error('Username is required')
  const db = getSettingsDb()
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES ('admin_username', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(username)
}

/**
 * Get the admin username.
 */
export function getAdminUsername() {
  try {
    const db = getSettingsDb()
    const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_username'").get()
    return row?.value || 'admin'
  } catch { return 'admin' }
}

/**
 * Attempt to log in. Returns a session token on success.
 */
export function login(username, password) {
  const db = getSettingsDb()
  const storedUser = db.prepare("SELECT value FROM settings WHERE key = 'admin_username'").get()
  const storedHash = db.prepare("SELECT value FROM settings WHERE key = 'admin_password_hash'").get()

  if (!storedHash) throw new Error('No admin account configured')

  const expectedUser = storedUser?.value || 'admin'
  if (username !== expectedUser) throw new Error('Invalid credentials')

  if (!verifyPassword(password, storedHash.value)) {
    throw new Error('Invalid credentials')
  }

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, {
    username,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  })

  return token
}

/**
 * Validate a session token. Returns the session data or null.
 */
export function validateSession(token) {
  if (!token) return null
  const session = sessions.get(token)
  if (!session) return null
  if (Date.now() > session.expiresAt) {
    sessions.delete(token)
    return null
  }
  return session
}

/**
 * Destroy a session (logout).
 */
export function destroySession(token) {
  sessions.delete(token)
}

/**
 * Express middleware that requires a valid session.
 * Skips auth for setup routes and login.
 */
export function requireAuth(req, res, next) {
  // Skip auth for setup routes (they're used before login)
  if (req.path.startsWith('/setup/') || req.path === '/setup') {
    return next()
  }
  // Skip auth for login, logout, status, and setup
  if (req.path.startsWith('/auth/')) {
    return next()
  }
  // Skip auth for health check (needed for login page to detect backend)
  if (req.path === '/health') {
    return next()
  }

  // Check for session token in cookie or Authorization header
  const token = req.cookies?.[SESSION_COOKIE] ||
                req.headers['authorization']?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const session = validateSession(token)
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid' })
  }

  req.session = session
  next()
}