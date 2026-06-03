const db = require('../../../shared/db');

const findBySeatNumber = async (seatNumber) => {
  const [rows] = await db.query(
    'SELECT * FROM seats WHERE seat_number = ?',
    [seatNumber]
  );
  return rows[0];
};

const lockSeat = async (seatNumber, sessionId) => {
  await db.query(
    `UPDATE seats 
     SET status='locked', locked_session_id=?, locked_at=NOW()
     WHERE seat_number=? AND status='available'`,
    [sessionId, seatNumber]
  );
};

const releaseSeat = async (seatNumber) => {
  await db.query(
    `UPDATE seats 
     SET status='available', locked_session_id=NULL, locked_at=NULL
     WHERE seat_number=?`,
    [seatNumber]
  );
};

module.exports = { findBySeatNumber, lockSeat, releaseSeat };
