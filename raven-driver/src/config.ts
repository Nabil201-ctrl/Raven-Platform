// Centralized configuration for the Raven Driver console.
// Uses Vite environment variables. See .env.example.

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const WS_BASE =
  import.meta.env.VITE_WS_BASE || 'http://localhost:5000';

export const BOOKING_WS_NAMESPACE = '/booking';

export const IS_PROD_API = !!(import.meta.env.VITE_API_BASE && !import.meta.env.VITE_API_BASE.includes('localhost'));
