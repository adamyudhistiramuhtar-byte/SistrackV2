/**
 * rateLimiter.js — 3 tingkat Rate Limiting untuk proteksi API
 */
const rateLimit = require('express-rate-limit');

// Ketat: login — 10 percobaan per 15 menit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
  skipSuccessfulRequests: true,
});

// Sedang: write operations — 30 req/menit
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak request. Tunggu sebentar.' },
});

// Longgar: read operations — 200 req/menit
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, writeLimiter, readLimiter };
