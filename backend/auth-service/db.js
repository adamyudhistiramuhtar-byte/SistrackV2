const mysql = require('mysql2/promise');

// Normalize DB password: handle 'No' literal as empty
const rawPassword = process.env.DB_PASSWORD;
const password = (rawPassword === 'No' || rawPassword === 'NO' || rawPassword === 'no') ? '' : (rawPassword || '');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password,
  database: process.env.DB_NAME || 'sistrackv2',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
