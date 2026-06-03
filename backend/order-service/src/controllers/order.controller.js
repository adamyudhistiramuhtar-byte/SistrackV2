// order.controller.js - DB-first implementation with in-memory fallback

const db = require('../../../shared/db');
const orderService = require('../services/order.service');

// simple in-memory fallback store (used if DB missing)
let FALLBACK_ORDERS = [];
let FALLBACK_ID = 100000;

const createInMemoryOrder = (seatNumber, customerName, phone, paymentMethod, items) => {
  const total = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0);
  const order = {
    id: FALLBACK_ID++,
    sessionId: null,
    seatNumber: Number(seatNumber),
    customerName: customerName || null,
    phone: phone || null,
    paymentMethod: paymentMethod || null,
    items: items.map((it) => ({ product_id: it.product_id, qty: it.qty, price: it.price, subtotal: (it.qty * it.price) })),
    total,
    status: 'pending',
    createdAt: new Date(),
  };
  FALLBACK_ORDERS.push(order);
  return order;
};

exports.createOrder = async (req, res) => {
  try {
    console.log('[ORDER CREATE DEBUG] body=', req.body, 'rawBody=', req.rawBody);
    const { seatNumber, customerName, phone, paymentMethod, items } = req.body;

    if (!seatNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid order payload' });
    }

    // Try DB-backed flow first
    try {
      const sessionId = await orderService.startSession(Number(seatNumber));

      const orderId = await orderService.createOrder({
        session_id: sessionId,
        seat_number: Number(seatNumber),
        customer_name: customerName || null,
        phone: phone || null,
        payment_method: paymentMethod || null,
        items,
      });

      // fetch created order + items to return
      const [rows] = await db.query(
        `SELECT id, session_id, seat_number, customer_name, phone, payment_method, total_amount, status, created_at
         FROM orders WHERE id = ?`,
        [orderId]
      );

      const [itemsRows] = await db.query(
        `SELECT product_id, qty, price_snapshot AS price, subtotal FROM order_items WHERE order_id = ?`,
        [orderId]
      );

      const order = rows[0] || null;
      if (!order) return res.status(500).json({ success: false, message: 'Order created but not found' });

      const out = {
        id: order.id,
        sessionId: order.session_id,
        seatNumber: order.seat_number,
        customerName: order.customer_name,
        phone: order.phone,
        paymentMethod: order.payment_method,
        items: itemsRows,
        total: Number(order.total_amount || 0),
        status: order.status,
        createdAt: order.created_at,
      };

      return res.json({ success: true, data: out });
    } catch (dbErr) {
      console.warn('[ORDER CREATE] DB flow failed, falling back to in-memory store:', dbErr && dbErr.message);
      const fallback = createInMemoryOrder(seatNumber, customerName, phone, paymentMethod, items);
      return res.json({ success: true, data: fallback });
    }
  } catch (err) {
    console.error('[CREATE ORDER ERROR]', err && err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    try {
      const [rows] = await db.query(
        `SELECT id, seat_number, customer_name, total_amount, status, created_at FROM orders ORDER BY created_at DESC`
      );

      const orderIds = rows.map(r => r.id);
      let itemsByOrder = new Map();
      if (orderIds.length) {
        const placeholders = orderIds.map(() => '?').join(',');
        const [itemsRows] = await db.query(
          `SELECT order_id, product_id, qty, price_snapshot AS price, subtotal FROM order_items WHERE order_id IN (${placeholders})`,
          orderIds
        );
        for (const it of itemsRows) {
          const arr = itemsByOrder.get(it.order_id) || [];
          arr.push({ product_id: it.product_id, qty: it.qty, price: it.price, subtotal: it.subtotal });
          itemsByOrder.set(it.order_id, arr);
        }
      }

      const data = rows.map((r) => ({
        id: r.id,
        seatNumber: r.seat_number,
        customerName: r.customer_name,
        total: Number(r.total_amount || 0),
        status: r.status,
        createdAt: r.created_at,
        items: itemsByOrder.get(r.id) || [],
      }));

      return res.json({ success: true, data });
    } catch (dbErr) {
      console.warn('[GET ORDERS] DB query failed, returning in-memory orders:', dbErr && dbErr.message);
      return res.json({ success: true, data: FALLBACK_ORDERS });
    }
  } catch (err) {
    console.error('[GET ORDERS ERROR]', err && err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getSeats = async (req, res) => {
  try {
    try {
      const [rows] = await db.query('SELECT seat_number, status FROM seats');
      const data = rows.map((r) => ({ seatNumber: Number(r.seat_number), status: r.status }));
      return res.json({ success: true, data });
    } catch (dbErr) {
      console.warn('[GET SEATS] DB query failed, returning empty list:', dbErr && dbErr.message);
      return res.json({ success: true, data: [] });
    }
  } catch (err) {
    console.error('[GET SEATS ERROR]', err && err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.completeOrder = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    try {
      // fetch order to get session and seat
      const [rows] = await db.query('SELECT id, session_id, seat_number, total_amount FROM orders WHERE id = ?', [orderId]);
      const order = rows[0];
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      await orderService.completeOrder({ orderId: order.id, seatNumber: order.seat_number, sessionId: order.session_id, total: Number(order.total_amount || 0) });

      return res.json({ success: true, data: { id: order.id } });
    } catch (dbErr) {
      console.warn('[COMPLETE ORDER] DB flow failed, trying in-memory:', dbErr && dbErr.message);
      const idx = FALLBACK_ORDERS.findIndex((o) => o.id === orderId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Order not found' });
      FALLBACK_ORDERS[idx].status = 'completed';
      return res.json({ success: true, data: { id: orderId } });
    }
  } catch (err) {
    console.error('[COMPLETE ORDER ERROR]', err && err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
