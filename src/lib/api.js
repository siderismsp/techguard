const BASE = '/api'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  })
  if (!res.ok) {
    let msg = `API error ${res.status}`
    try {
      const body = await res.json()
      if (body.error) msg += `: ${body.error}`
    } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export const api = {
  // Devices
  getDevices: () => req('/devices'),
  updateDevice: (mac, data) => req(`/devices/${mac}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Enforcement
  getEnforcementStatus: () => req('/enforcement/status'),

  // Profiles
  getProfiles: () => req('/profiles'),
  createProfile: (data) => req('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (id, data) => req(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProfile: (id) => req(`/profiles/${id}`, { method: 'DELETE' }),

  // Rules
  getRules: (profileId) => req(`/profiles/${profileId}/rules`),
  createRule: (profileId, data) => req(`/profiles/${profileId}/rules`, { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (id, data) => req(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRule: (id) => req(`/rules/${id}`, { method: 'DELETE' }),

  // Overrides
  getOverrides: (profileId, year, month) => req(`/profiles/${profileId}/overrides?year=${year}&month=${month}`),
  setOverride: (profileId, data) => req(`/profiles/${profileId}/overrides`, { method: 'POST', body: JSON.stringify(data) }),
  deleteOverride: (profileId, date) => req(`/profiles/${profileId}/overrides/${date}`, { method: 'DELETE' }),

  // Parental Controls
  getContentFilters: () => req('/parental/filters'),
  updateContentFilter: (id, data) => req(`/parental/filters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getBlockLists: () => req('/parental/blocklists'),
  updateBlockList: (id, data) => req(`/parental/blocklists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Activity / Monitoring
  getActivity: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return req(`/logs/activity${qs ? '?' + qs : ''}`)
  },
  getRecentLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return req(`/logs/recent${qs ? '?' + qs : ''}`)
  },
  ingestLogs: (logs) => req('/logs/ingest', { method: 'POST', body: JSON.stringify({ logs }) }),
  purgeLogs: (days = 30) => req(`/logs/purge?days=${days}`, { method: 'DELETE' }),

  // Screen Time
  getScreenTimeBudget: (profileId) => req(`/screentime/budgets/${profileId}`),
  updateScreenTimeBudget: (profileId, data) => req(`/screentime/budgets/${profileId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getScreenTimeUsage: (profileId, deviceMac) => {
    const path = deviceMac ? `/screentime/usage/${profileId}/${deviceMac}` : `/screentime/usage/${profileId}`
    return req(path)
  },
  getScreenTimeStatus: (profileId) => req(`/screentime/status/${profileId}`),
  trackScreenTime: (data) => req('/screentime/track', { method: 'POST', body: JSON.stringify(data) }),

  // Stats & Health
  getStats: () => req('/stats'),
  getHealth: () => req('/health'),
}