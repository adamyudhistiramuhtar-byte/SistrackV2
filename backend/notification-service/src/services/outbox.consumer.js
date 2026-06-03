const db = require('../../../shared/db');
const { emitAdmin } = require('../socket');

const pollOutbox = async () => {
  try {
    const [events] = await db.query(
      `SELECT * FROM outbox_events 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT 10`
    );

    for (const event of events) {
      const payload = JSON.parse(event.payload);

      if (event.event_type === 'ORDER_CREATED') {
        emitAdmin('order_created', payload);
      }

      if (event.event_type === 'ORDER_COMPLETED') {
        emitAdmin('order_completed', payload);
      }

      await db.query(
        'UPDATE outbox_events SET status = "processed" WHERE id = ?',
        [event.id]
      );
    }
  } catch (err) {
    console.error('Outbox consumer error:', err.message);
  }
};

module.exports = {
  pollOutbox,
};
