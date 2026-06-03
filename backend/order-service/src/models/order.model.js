const db = require('../../../shared/db');

const createOrder = async (data) => {
  const [res] = await db.query(
    `INSERT INTO orders 
     (session_id, seat_number, customer_name, phone, payment_method)
     VALUES (?,?,?,?,?)`,
    [
      data.session_id,
      data.seat_number,
      data.customer_name,
      data.phone,
      data.payment_method
    ]
  );
  return res.insertId;
};

const setTotal = async (orderId, total) => {
  await db.query(
    `UPDATE orders SET total_amount = ?, status = 'pending', created_at = NOW() WHERE id = ?`,
    [total, orderId]
  );
};

const addItem = async (orderId, item) => {
  await db.query(
    `INSERT INTO order_items 
     (order_id, product_id, qty, price_snapshot, subtotal)
     VALUES (?,?,?,?,?)`,
    [
      orderId,
      item.product_id,
      item.qty,
      item.price,
      item.qty * item.price
    ]
  );
};

const completeOrder = async (orderId, total) => {
  await db.query(
    `UPDATE orders 
     SET status='completed', total_amount=?, completed_at=NOW()
     WHERE id=?`,
    [total, orderId]
  );
};

module.exports = { createOrder, addItem, completeOrder };
