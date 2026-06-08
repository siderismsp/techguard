import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from './lib/api'
import Sidebar from './components/Sidebar'
import SetupWizard from './components/SetupWizard'
import LoginPage from './components/LoginPage'
import DevicesPage from './pages/Devices'
import SchedulesPage from './pages/Schedules'
import ActivityPage from './pages/Activity'
import ProfilesPage from './pages/Profiles'
import ParentalControlsPage from './pages/ParentalControls'
import DnsPage from './pages/Dns'
import SettingsPage from './pages/Settings'

export default function App() {
  const [health, setHealth] = useState(null)
  const [setupDone, setSetupDone] = useState(null) // null = loading, true/false
  const [authenticated, setAuthenticated] = useState(null) // null = loading, true/false

  useEffect(() => {
    // Check if DNS setup has been completed
    fetch('/api/setup/status')
      .then(r => r.json())
      .then(data => setSetupDone(data.configured))
      .catch(() => setSetupDone(true))
  }, [])

  useEffect(() => {
    // Check auth status
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated) {
          setAuthenticated(true)
        } else if (!data.authConfigured) {
          // Auth not configured yet — skip login
          setAuthenticated(true)
        } else {
          setAuthenticated(false)
        }
      })
      .catch(() => setAuthenticated(true)) // If backend unreachable, skip auth
  }, [])

  useEffect(() => {
    if (!setupDone || !authenticated) return

    api.getHealth().then(setHealth).catch(() => setHealth({ technitium: false }))
    const t = setInterval(() => {
      api.getHealth().then(setHealth).catch(() => setHealth({ technitium: false }))
    }, 30000)
    return () => clearInterval(t)
  }, [setupDone, authenticated])

  // Loading
  if (setupDone === null || authenticated === null) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 14, marginBottom: 4 }}>TechGuard</div>
          <div style={{ fontSize: 11 }}>Loading...</div>
        </div>
      </div>
    )
  }

  // Show setup wizard if DNS not configured
  if (!setupDone) {
    return <SetupWizard onComplete={() => setSetupDone(true)} />
  }

  // Show login page if not authenticated
  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar health={health} onLogout={() => setAuthenticated(false)} />
      <Routes>
        <Route path="/" element={<DevicesPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/profiles" element={<ProfilesPage />} />
        <Route path="/parental-controls" element={<ParentalControlsPage />} />
        <Route path="/dns" element={<DnsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}