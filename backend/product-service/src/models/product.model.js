const db = require('../../../shared/db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM products');
  return rows;
};

const getAvailable = async () => {
  const [rows] = await db.query(
    'SELECT * FROM products WHERE is_available = 1'
  );
  return rows;
};

const create = async ({ name, price, category }) => {
  const [result] = await db.query(
    'INSERT INTO products (name, price, category) VALUES (?, ?, ?)',
    [name, price, category]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];

  for (const key in data) {
    fields.push(`${key} = ?`);
    values.push(data[key]);
  }

  values.push(id);

  const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(query, values);
};

const toggleAvailability = async (id) => {
  await db.query(
    'UPDATE products SET is_available = !is_available WHERE id = ?',
    [id]
  );
};

module.exports = {
  getAll,
  getAvailable,
  create,
  update,
  toggleAvailability,
};
