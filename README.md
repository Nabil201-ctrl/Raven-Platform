# 🐦 Raven — Campus Transit Platform (Monorepo)

Raven is a full-stack real-time transit booking system for university campuses featuring:

- **Passenger app** (`raven-frontend`) — Book shuttles/kekes, live seat locks, wallet, calls, reverse trips
- **Driver console** (`raven-driver`) — Verification, ride management, live updates
- **Admin console** (`raven-admin`) — Fleet, complaints, approvals, overrides
- **Backend** (`raven-backend`) — NestJS, WebSocket seat locking engine, Monnify sandbox wallets, Africa's Talking voice masking, file-backed demo DB

## Directory Layout

```
raven/
├── raven-frontend/   # Passenger SPA (Vite + React + TS)
├── raven-driver/     # Driver SPA
├── raven-admin/      # Admin SPA
├── raven-backend/    # NestJS API + WS gateway + persistence
└── tailwind.config.js (shared reference)
```

## Getting to Production

Each package now ships with:
- Environment-driven configuration (`VITE_API_BASE` etc for frontends)
- Production build tuning in Vite
- ESLint + typecheck scripts
- Error boundaries
- Improved documentation

**Critical remaining work** (see individual READMEs):
- Replace JSON file DB with MongoDB (Mongoose already scaffolded)
- Implement real JWT + bcrypt authentication + per-request user context
- Multi-user isolation + proper concurrency for bookings/seat locks
- Secure payment webhooks + live credentials
- Comprehensive test coverage + CI

## Local Multi-App Dev

Typical ports (configurable in each vite.config.ts):
- Frontend (users): 3000
- Driver: 3001
- Admin: 3002
- Backend: 5000 (with `/api` prefix + `/booking` WS ns)

Set the same backend URL in each frontend's `.env` (or platform envs for deploys).

## Backend

See [raven-backend/README.md](./raven-backend/README.md) for detailed architecture, WebSocket events, Docker, and production hardening status.

## Deployment

- Frontends: Vercel-friendly (vercel.json + _redirects for SPA routing). Configure VITE_* vars at build time.
- Backend: Docker multi-stage image ready. Deploy anywhere that supports Node 20 + persistent volume for `data/` (or switch to managed DB).

## Contributing / Quality

Run in each frontend:
```bash
npm run typecheck
npm run lint
npm run build
```

Backend:
```bash
npm run build
npm test
```

## License

Internal / educational use for now.
