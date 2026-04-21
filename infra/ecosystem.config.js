/**
 * PM2 deployment (alternative to Docker). Run with:
 *   pnpm install && pnpm build
 *   pm2 start infra/ecosystem.config.js
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'isp-api',
      cwd: './apps/api',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production' },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      time: true,
    },
    {
      name: 'isp-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production' },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      time: true,
    },
  ],
};
