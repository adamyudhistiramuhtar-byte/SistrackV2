const mysql = require('mysql2/promise');

// Normalize and sanitize DB config. Treat values like 'No' (case-insensitive) as empty password.
const rawPassword = (process.env.DB_PASSWORD || '').toString().trim();
const password = (rawPassword.toLowerCase() === 'no') ? '' : rawPassword;

const host = (process.env.DB_HOST || 'localhost').toString();
const user = (process.env.DB_USER || 'root').toString();
const database = (process.env.DB_NAME || 'sistrackv2').toString();
const port = Number(process.env.DB_PORT || 3306);

const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
