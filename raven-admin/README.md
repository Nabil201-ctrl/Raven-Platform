# 🛡️ Raven Admin Console

Standalone admin interface for fleet management, complaints, shuttle CRUD, and reverse-trip controls.

Built with the same stack as the passenger app (React + TS + Vite + Tailwind).

## Local Development

```bash
npm install
npm run dev   # http://localhost:3002 (proxies to backend)
```

Configure via `.env` (see `.env.example`).

Use `npm run lint` and `npm run typecheck` before shipping.

## Production

- Build with correct `VITE_API_BASE` and `VITE_WS_BASE` pointing at the live backend.
- Deploy independently on Vercel (same SPA config as passenger frontend).
- Admin operations are additionally protected server-side via `x-admin-key` header (see backend AdminGuard).
- Set `raven_admin_key` in localStorage during testing or use proper key injection in future builds.

See main Raven Backend README for full system context.
