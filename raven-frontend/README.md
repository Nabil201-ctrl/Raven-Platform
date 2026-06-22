# 🐦 Raven Frontend (Passenger App)

Production-grade React + TypeScript + Vite client for the Raven campus transit platform.

Real-time seat booking, live shuttle telemetry, wallet (Monnify sandbox), voice calls, and reverse-trip pre-booking flows.

## 🚀 Quick Start

```bash
npm install
npm run dev          # Runs on http://localhost:3000 (proxies /api -> backend :5000)
```

## Environment Configuration (Production Critical)

Never hardcode backend URLs. Use environment variables:

```bash
cp .env.example .env
```

- `VITE_API_BASE` — Full backend API root (with `/api`)
- `VITE_WS_BASE` — WebSocket root

**Production (Vercel / hosting):**
Set the same `VITE_*` variables in your platform's environment settings before build. Example:

```
VITE_API_BASE=https://raven-backend.example.com/api
VITE_WS_BASE=https://raven-backend.example.com
```

## Available Scripts

| Script        | Description                              |
|---------------|------------------------------------------|
| `dev`         | Start local dev server + HMR             |
| `build`       | Type-check + production build to `dist/` |
| `preview`     | Preview production build locally         |
| `lint`        | Run ESLint (strict, zero warnings)       |
| `lint:fix`    | Auto-fix lint issues                     |
| `typecheck`   | Run TypeScript compiler with no emit     |

## Production Readiness Features (Frontend)

- Strict TypeScript + Vite production build config (manual chunks, es2020 target)
- Environment-driven API / WS endpoints (no localhost in prod builds)
- React ErrorBoundary at root for graceful crash recovery
- ESLint + React Hooks + Refresh rules + TypeScript rules
- SPA routing handled via vercel.json rewrites + _redirects
- Responsive, accessible dark-first UI with theme tokens
- Real-time via socket.io-client with proper room management

## Deployment

- **Vercel**: Connect repo, set Framework preset "Vite", add the VITE_* env vars, and deploy. The `vercel.json` + `_redirects` ensure SPA fallback.
- Backend must be separately deployed (Docker / Railway / Render / Fly.io etc) and expose the public API base.

## Notes

The current implementation includes showcase fallbacks when the backend is unreachable or in early development. In true production, wire up robust error toasts + disable heavy silent mocks (controlled via future `VITE_DEMO_MODE` flag).
