const Seat = require('../models/seat.model');
const Session = require('../models/session.model');
const Order = require('../models/order.model');
const Outbox = require('../models/outbox.model');
const db = require('../../../shared/db');

const startSession = async (seatNumber) => {
  const seat = await Seat.findBySeatNumber(seatNumber);
  if (!seat || seat.status !== 'available') {
    throw new Error('Seat not available');
  }

  const sessionId = await Session.createSession(seatNumber);
  await Seat.lockSeat(seatNumber, sessionId);

  return sessionId;
};

const createOrder = async (data) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.query(
      `INSERT INTO orders (session_id, seat_number, customer_name, phone, payment_method, status, created_at)
       VALUES (?,?,?,?,?, 'pending', NOW())`,
      [data.session_id, data.seat_number, data.customer_name, data.phone, data.payment_method]
    );

    const orderId = res.insertId;

    let total = 0;
    for (const item of data.items) {
      const qty = Number(item.qty || 0);
      const price = Number(item.price || item.price_snapshot || 0);
      const subtotal = qty * price;
      const productId = item.product_id || item.id || null;
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, qty, price_snapshot, subtotal) VALUES (?,?,?,?,?)`,
        [orderId, productId, qty, price, subtotal]
      );
      total += subtotal;
    }

    await conn.query(`UPDATE orders SET total_amount = ? WHERE id = ?`, [total, orderId]);

    // insert outbox event within same transaction
    await conn.query(`INSERT INTO outbox_events (event_type, payload) VALUES (?,?)`, ['ORDER_CREATED', JSON.stringify({ orderId })]);

    await conn.commit();
    return orderId;
  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    console.error('[CREATE ORDER TX ERROR]', err && err.message);
    throw err;
  } finally {
    conn.release();
  }
};

const completeOrder = async ({ orderId, seatNumber, sessionId, total }) => {
  await Order.completeOrder(orderId, total);
  await Session.endSession(sessionId);
  await Seat.releaseSeat(seatNumber);

  await Outbox.createEvent('ORDER_COMPLETED', { orderId });
};

module.exports = { startSession, createOrder, completeOrder };
