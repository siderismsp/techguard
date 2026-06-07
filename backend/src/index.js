import express from 'express'
import cors from 'cors'
import { getDb } from './lib/db.js'
import { startEnforcer } from './enforcer.js'
import devicesRouter from './routes/devices.js'
import profilesRouter from './routes/profiles.js'
import rulesRouter from './routes/rules.js'
import overridesRouter from './routes/overrides.js'
import parentalRouter from './routes/parental.js'
import statsRouter from './routes/stats.js'
import healthRouter from './routes/health.js'
import logsRouter from './routes/logs.js'
import screentimeRouter from './routes/screentime.js'
import settingsRouter from './routes/settings.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '5mb' }))

// Initialize database on startup
getDb()

// Apply saved settings to Technitium client
import('./lib/technitium.js').then(async ({ configureFromSettings }) => {
  try { await configureFromSettings() } catch {}
})

// Start the rule enforcer (checks every 60s)
startEnforcer(60000)

// Routes
app.use('/api', devicesRouter)
app.use('/api', profilesRouter)
app.use('/api', rulesRouter)
app.use('/api', overridesRouter)
app.use('/api', parentalRouter)
app.use('/api', statsRouter)
app.use('/api', healthRouter)
app.use('/api', logsRouter)
app.use('/api', screentimeRouter)
app.use('/api', settingsRouter)

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`TechGuard backend running on port ${PORT}`)
})