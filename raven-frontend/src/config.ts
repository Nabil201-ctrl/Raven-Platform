// Centralized configuration for the Raven platform.
// Uses Vite environment variables for production flexibility.
// Set VITE_API_BASE and VITE_WS_BASE in .env, .env.production, or your hosting platform (Vercel, etc).
// Defaults to local dev backend for convenience.

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const WS_BASE =
  import.meta.env.VITE_WS_BASE || 'http://localhost:5000';

// The booking namespace used for all real-time transit events (seat locks, occupancy, reverse trips, telemetry)
export const BOOKING_WS_NAMESPACE = '/booking';

// Optional: expose a flag to know if running against production backend
export const IS_PROD_API = !!(import.meta.env.VITE_API_BASE && !import.meta.env.VITE_API_BASE.includes('localhost'));
