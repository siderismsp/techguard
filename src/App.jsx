import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from './lib/api'
import Sidebar from './components/Sidebar'
import DevicesPage from './pages/Devices'
import SchedulesPage from './pages/Schedules'
import ActivityPage from './pages/Activity'
import ProfilesPage from './pages/Profiles'
import ParentalControlsPage from './pages/ParentalControls'
import DnsPage from './pages/Dns'
import SettingsPage from './pages/Settings'

export default function App() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    api.getHealth().then(setHealth).catch(() => setHealth({ technitium: false }))
    const t = setInterval(() => {
      api.getHealth().then(setHealth).catch(() => setHealth({ technitium: false }))
    }, 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar health={health} />
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