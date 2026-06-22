# 🚐 Raven Driver Console

Driver-facing app for real-time ride management, approvals, ratings, masked voice calls, and vehicle verification.

## Development

```bash
npm install
npm run dev
```

Runs on port 3001 by default.

## Env & Production

Same VITE_API_BASE / VITE_WS_BASE pattern as other Raven frontends.

Run `npm run build`, `lint`, `typecheck`.

## Integration

- Drivers authenticate via systemCode + verification flow managed from Admin Console.
- Real-time updates via the shared `/booking` Socket.IO namespace.
- Call bridging powered by Africa's Talking (backend).

See the backend README for architecture and WebSocket contracts.
