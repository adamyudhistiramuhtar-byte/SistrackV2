require('dotenv').config();

// IMP-001: Validasi env vars SEBELUM inisialisasi apapun
const validateEnv = require('../../shared/validateEnv');
validateEnv(['PORT', 'AUTH_SERVICE_URL', 'PRODUCT_SERVICE_URL', 'ORDER_SERVICE_URL', 'JWT_SECRET']);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const logger = require('../../shared/logger');
const { authLimiter, writeLimiter, readLimiter } = require('../../shared/rateLimiter');
const { errorHandler, notFoundHandler } = require('../../shared/errorHandler');
const setupProxyRoutes = require('./routes/proxy.routes');

const app = express();

// IMP-004: Security headers
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

// IMP-004: CORS berbasis whitelist dari env (bukan wildcard)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} tidak diizinkan`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
}));

// capture raw request body for debugging/forwarding
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      try {
        req.rawBody = buf && buf.length ? buf.toString('utf8') : '';
      } catch (e) {
        req.rawBody = '';
      }
    },
  })
);
app.use(logger);

// IMP-003: Rate Limiting per-endpoint tier
app.use('/api/auth/login', authLimiter);
app.use('/api/orders', writeLimiter);
app.use('/api/products', readLimiter);

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ service: 'api-gateway', status: 'ok' });
});

/**
 * Register all routes
 */
setupProxyRoutes(app);

// IMP-007: Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
