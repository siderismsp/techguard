# Contributing to TechGuard

Thanks for wanting to help! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/yourusername/techguard.git
cd techguard

# Frontend
npm install
npm run dev          # http://localhost:5173

# Backend (separate terminal)
cd backend
npm install
npm start            # http://localhost:3001
```

The frontend proxies `/api` requests to `localhost:3001` automatically.

## Project Structure

```
techguard/
├── src/                  # React frontend (Vite)
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route pages
│   └── lib/api.js        # API client
├── backend/              # Node.js API server (Express)
│   └── src/
│       ├── routes/       # API route handlers
│       ├── lib/          # Database, Technitium client, service map
│       └── enforcer.js   # Schedule/budget enforcement engine
├── docker-compose.yml    # Full stack deployment
└── package.json
```

## Making Changes

1. **Fork the repo** on GitHub
2. **Create a branch**: `git checkout -b feature/your-idea`
3. **Make your changes**
4. **Test**: `npm run build` (frontend) and check the backend starts cleanly
5. **Commit**: Use clear commit messages
6. **Push**: `git push origin feature/your-idea`
7. **Open a Pull Request**

## Ideas for Contributions

- **More domain mappings** — add entries to `backend/src/lib/service-map.js` for better DNS log categorization
- **Block page** — redirect blocked devices to a nice-looking "Access Restricted" page
- **Notifications** — email/push alerts when screen time is almost up
- **Dark/light mode toggle**
- **Mobile responsive layout**
- **Authentication** — login page so multiple parents can have accounts
- **Export logs** — CSV/JSON download of activity data
- **Technitium API tools** — more integrations like DNS-over-HTTPS config

## Code Style

- Use the same inline style pattern (no CSS modules, no Tailwind — keep it consistent)
- Prettier formatting with 2-space indent
- camelCase for JS, snake_case for database columns
- Keep components focused — if a file gets >300 lines, split it up

## Questions?

Open an issue on GitHub. We aim to respond within a few days.

## License

MIT — do what you want, just give credit.