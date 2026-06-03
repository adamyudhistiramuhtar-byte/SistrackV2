// order.routes.js — IMP-002/008/009: Rewrite dengan validation, state machine, & admin endpoints
const express = require('express');
const router = express.Router();
const { createOrderRules } = require('../validators/order.validator');
const { AppError } = require('../../../../shared/errorHandler');
const { STATUS_TRANSITIONS, STATUS_LABELS } = require('../constants/orderStatus');
const db = require('../../../../shared/db');
const orderService = require('../services/order.service');

const {
  createOrder,
  getOrders,
  getSeats,
  completeOrder,
} = require('../controllers/order.controller');
const jwt = require('jsonwebtoken');

// Middleware untuk verifikasi JWT session customer
const verifyCustomerSession = (req, res, next) => {
  const token = req.headers['x-session-token'];
  if (!token) return res.status(401).json({ success: false, message: 'Session token missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'customer_session' || !decoded.seat_number) {
      throw new Error('Invalid token type');
    }
    // inject seatNumber into body so validator and controller can use it
    req.body.seatNumber = decoded.seat_number;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
};

// POST /orders — Customer: create order (IMP-012: with session token validation)
router.post('/', verifyCustomerSession, createOrderRules, createOrder);

// GET /orders — Admin: list all orders with filter & pagination (IMP-009)
router.get('/', getOrders);

// GET /orders/seats — Customer: available seats
router.get('/seats', getSeats);

// POST /orders/:id/complete — Admin: complete order (legacy compat)
router.post('/:id/complete', completeOrder);

// PATCH /orders/:id/status — Admin: update order status with state machine (IMP-008)
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;
    if (!newStatus) throw new AppError("Field 'status' wajib diisi", 422);

    const [[order]] = await db.query('SELECT id, status FROM orders WHERE id = ?', [req.params.id]);
    if (!order) throw new AppError('Order tidak ditemukan', 404);

    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Transisi tidak valid: '${order.status}' → '${newStatus}'. Yang diizinkan: ${allowed.join(', ') || 'tidak ada'}`,
        422
      );
    }

    const completedAt = newStatus === 'completed' ? new Date() : null;
    await db.query(
      'UPDATE orders SET status = ?, completed_at = ? WHERE id = ?',
      [newStatus, completedAt, order.id]
    );

    // IMP-011: Emit real-time event ke customer via notification-service internal endpoint
    const axios = require('axios');
    const NOTIF_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
    axios.post(`${NOTIF_URL}/internal/notify/status-changed`, {
      orderId: order.id,
      status: newStatus,
      statusLabel: STATUS_LABELS[newStatus] || newStatus
    }).catch(err => console.warn('Notifikasi status gagal (non-critical):', err.message));

    res.json({
      success: true,
      message: `Status berhasil diperbarui ke '${STATUS_LABELS[newStatus] || newStatus}'`,
      data: { id: order.id, status: newStatus, label: STATUS_LABELS[newStatus] },
    });
  } catch (err) {
    next(err);
  }
});

// GET /orders/:id — Admin: detail order with items (IMP-009)
router.get('/:id', async (req, res, next) => {
  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) throw new AppError('Order tidak ditemukan', 404);

    const [items] = await db.query(
      `SELECT oi.id, oi.qty, oi.price_snapshot AS price, oi.subtotal,
              p.name AS product_name, p.category AS product_category
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...order, items } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
