module.exports = {
  apps: [
    {
      name: 'raven-backend',
      script: 'dist/main.js',
      instances: 1,              // Single instance — required for in-memory WebSocket seat locks
      exec_mode: 'fork',         // Fork mode (not cluster) to keep socket state consistent
      watch: false,              // Disable watching in production
      max_memory_restart: '800M', // Auto-restart if process leaks memory beyond 800MB
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        // Config variables below are expected to be injected by the system env
        // or loaded via dotenv in the deployment pipeline.
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,          // Consolidate logs from all clustered workers
      kill_timeout: 4000,        // Allow 4 seconds graceful shutdown time
    },
  ],
};
