<div align="center">
  <img src="https://img.shields.io/badge/TECHGUARD-Parental%20DNS-00A3FF?style=for-the-badge" alt="TechGuard" />
  
  **A modern web UI for Technitium DNS Server**  
  Schedule access, screen time budgets, content filtering & activity monitoring
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
  [![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)](docker-compose.yml)
  ![Node](https://img.shields.io/badge/Node-20+-339933?logo=node.js)
  ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
</div>

---

## Features

| Feature | Description |
|---------|-------------|
| **Device Management** | See all network devices, assign profiles, edit names/IPs |
| **Time Windows** | Per-profile schedules — "School nights 7AM–8PM", weekends 9AM–10PM |
| **Screen Time Budgets** | Daily minute limits with live progress bars (15m–8h range) |
| **Calendar Overrides** | Block/unrestrict specific days (holidays, birthdays) |
| **Content Filtering** | 16 categories: adult, social media, gaming, AI, streaming, etc. |
| **Activity Monitoring** | DNS queries → human-readable services ("Roblox", not "cdn.roblox.com") |
| **DNS Management** | Upstream DNS selection, block list toggles |
| **Rule Enforcement** | Auto-blocks devices when out-of-schedule or over-budget |

## Quick Start

### Option 1: Docker Compose (easiest)

```bash
git clone https://github.com/yourusername/techguard.git
cd techguard

# Set your Technitium API key
echo "TECHNITIUM_API_KEY=your-key-here" > .env

# Start everything
docker compose up -d

# Open http://localhost:3000
```

This starts Technitium DNS, the TechGuard API, and the frontend — all pre-configured.

### Option 2: Manual

```bash
git clone https://github.com/yourusername/techguard.git
cd techguard

# Frontend
npm install
npm run dev

# Backend (new terminal)
cd backend
npm install
cp .env.example .env   # Edit with your Technitium URL & API key
npm start
```

Open http://localhost:5173 — the frontend proxies `/api` to the backend.

## Architecture

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│  TechGuard   │────▶│  TechGuard    │────▶│   Technitium     │
│  Frontend    │     │  Backend      │     │   DNS Server     │
│  (:3000)     │     │  (:3001)      │     │   (:5380)        │
│  React + Vite│     │  Express      │     │   DNS + DHCP     │
└──────────────┘     │  + SQLite     │     └──────────────────┘
                     └───────────────┘
```

TechGuard stores schedules, budgets, and content filter settings in SQLite. It reads device info from Technitium's DHCP leases and enforces rules by communicating with Technitium's REST API.

## Screenshots

<details>
<summary>Click to expand</summary>

### Devices Page
Lists all network devices with online status, profile badges, and real-time restriction indicators.

### Schedules Page
Time window rules + screen time budget sliders + monthly calendar overrides — all per profile.

### Activity Page
DNS logs categorized into services (Roblox, YouTube, ChatGPT) with timeline charts and device breakdown.

### Parental Controls
Toggle content categories per profile: block adult content, social media, gaming, streaming, AI, etc.

</details>

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend API port |
| `TECHNITIUM_URL` | `http://localhost:5380` | Technitium DNS Server address |
| `TECHNITIUM_API_KEY` | — | API key for DNS control |
| `DB_PATH` | `./data/techguard.db` | SQLite database location |
| `VITE_API_URL` | `http://localhost:3001` | Backend URL for dev mode |

## API Overview (25+ endpoints)

| Category | Endpoints |
|----------|-----------|
| **Devices** | `GET /api/devices`, `PUT /api/devices/:mac` |
| **Profiles** | CRUD at `/api/profiles` |
| **Rules** | `GET/POST /api/profiles/:id/rules`, `PUT/DELETE /api/rules/:id` |
| **Overrides** | `GET/POST/DELETE /api/profiles/:id/overrides` |
| **Content Filters** | `GET/PUT /api/parental/filters/:id` |
| **Block Lists** | `GET/PUT /api/parental/blocklists/:id` |
| **Activity** | `GET /api/logs/activity`, `POST /api/logs/ingest` |
| **Screen Time** | `GET/PUT /api/screentime/budgets/:id`, `POST /api/screentime/track` |
| **Enforcement** | `GET /api/enforcement/status` |
| **Health** | `GET /api/health`, `GET /api/stats` |

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and project structure.

Ideas for contributions:
- More domain → service mappings in `backend/src/lib/service-map.js`
- Block page that shows "restricted" with a reason
- Email/text notifications when screen time is nearly up
- Mobile-responsive layout
- Authentication / multi-user support
- Data export (CSV download of activity logs)

## License

MIT — free to use, modify, and distribute. See [LICENSE](LICENSE).

---

<div align="center">
  Built for parents who know their network.
  <br/>
  <sub>Powered by Technitium DNS Server</sub>
</div>