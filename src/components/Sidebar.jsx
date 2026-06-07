import { NavLink } from 'react-router-dom'
import Logo from './Logo'

const links = [
  { to: '/', icon: 'ti-devices', label: 'Devices' },
  { to: '/activity', icon: 'ti-activity-heartbeat', label: 'Activity' },
  { to: '/schedules', icon: 'ti-clock', label: 'Schedules' },
  { to: '/profiles', icon: 'ti-users', label: 'Profiles' },
  { to: '/parental-controls', icon: 'ti-shield-lock', label: 'Parental Controls' },
  { to: '/dns', icon: 'ti-world', label: 'DNS' },
  { to: '/settings', icon: 'ti-settings', label: 'Settings' },
]

export default function Sidebar({ health }) {
  return (
    <aside style={{
      width: 220, flexShrink: 0, background: 'var(--bg-card)',
      borderRight: '0.5px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0
    }}>
      <div style={{
        padding: '14px 14px 10px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center'
      }}>
        <Logo compact size={32} />
      </div>

      <nav style={{ flex: 1, padding: '10px 10px' }}>
        {links.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 'var(--radius-sm)',
              marginBottom: 2, textDecoration: 'none',
              fontSize: 13, fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--text)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-hover)' : 'transparent',
              transition: 'all 0.15s'
            })}
          >
            <i className={`ti ${icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 14px', borderTop: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: health?.technitium ? 'var(--green)' : 'var(--red)'
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {health?.technitium ? 'Technitium connected' : 'Technitium offline'}
          </span>
        </div>
      </div>
    </aside>
  )
}