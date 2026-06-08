/**
 * TechGuard Frontend Server
 * Serves the built React app and proxies /api requests to the backend.
 */

import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000
const API_TARGET = process.env.API_URL || 'http://techguard-backend:3001'

// Proxy /api requests to the backend
app.use(createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  pathFilter: '/api'
}))

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')))

// SPA fallback — serve index.html for all non-API, non-file routes
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`TechGuard frontend serving on http://0.0.0.0:${PORT}`)
  console.log(`  Proxying /api to ${API_TARGET}`)
})