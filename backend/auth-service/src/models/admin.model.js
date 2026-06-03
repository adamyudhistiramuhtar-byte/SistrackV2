const db = require('../../../shared/db');

const findByEmail = async (email) => {
  const [rows] = await db.query(
    'SELECT * FROM admins WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0];
};

module.exports = {
  findByEmail,
};
