/**
 * errorHandler.js — Centralized Error Handling for all services
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isOperational = err.isOperational || false;

  // Structured logging
  console.error(JSON.stringify({
    level: 'error',
    method: req.method,
    path: req.path,
    statusCode,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  }));

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : 'Terjadi kesalahan pada server.',
    ...(process.env.NODE_ENV === 'development' && { detail: err.message, stack: err.stack }),
  });
};

const notFoundHandler = (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.path} tidak ditemukan`, 404));
};

module.exports = { AppError, errorHandler, notFoundHandler };
