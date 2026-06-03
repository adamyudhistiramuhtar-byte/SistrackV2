const db = require('../../../shared/db');

const createSession = async (seatNumber) => {
  const [res] = await db.query(
    'INSERT INTO customer_sessions (seat_number) VALUES (?)',
    [seatNumber]
  );
  return res.insertId;
};

const endSession = async (sessionId) => {
  await db.query(
    'UPDATE customer_sessions SET status="ended", ended_at=NOW() WHERE id=?',
    [sessionId]
  );
};

module.exports = { createSession, endSession };
