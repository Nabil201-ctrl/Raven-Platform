import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy target can be overridden via env (VITE_DEV_PROXY_TARGET or falls back to localhost backend)
const proxyTarget = process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      }
    }
  },
  // Production build optimizations
  build: {
    sourcemap: false, // set true temporarily if you need prod debugging
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
          realtime: ['socket.io-client'],
        },
      },
    },
  },
})