const db = require('../../../shared/db');

const createEvent = async (type, payload) => {
  await db.query(
    'INSERT INTO outbox_events (event_type, payload) VALUES (?,?)',
    [type, JSON.stringify(payload)]
  );
};

module.exports = { createEvent };
