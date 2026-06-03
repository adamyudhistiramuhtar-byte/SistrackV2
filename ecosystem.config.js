/**
 * ecosystem.config.js — IMP-006: PM2 Ecosystem untuk menjalankan semua microservices
 * Jalankan: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'gateway',
      script: './backend/gateway/src/index.js',
      watch: false,
      env: { PORT: 3000 },
    },
    {
      name: 'auth-service',
      script: './backend/auth-service/src/index.js',
      watch: false,
      env: { PORT: 3001 },
    },
    {
      name: 'product-service',
      script: './backend/product-service/src/index.js',
      watch: false,
      env: { PORT: 3002 },
    },
    {
      name: 'order-service',
      script: './backend/order-service/src/index.js',
      watch: false,
      env: { PORT: 3003 },
    },
    {
      name: 'notification-service',
      script: './backend/notification-service/src/index.js',
      watch: false,
      env: { PORT: 3004 },
    },
    {
      name: 'analytics-service',
      script: './backend/analytics-service/src/index.js',
      watch: false,
      env: { PORT: 50051 },
    },
  ],
};
