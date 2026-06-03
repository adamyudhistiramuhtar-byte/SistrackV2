/**
 * database/migrate.js — IMP-005: Custom Migration Runner (tanpa library tambahan)
 * Jalankan: node database/migrate.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', 'gateway', '.env') });

async function run() {
  console.log('🔄 Memulai proses migrasi database...');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'sistrackv2'}`);

  const rawPassword = (process.env.DB_PASSWORD || '').toString().trim();
  const password = (rawPassword.toLowerCase() === 'no') ? '' : rawPassword;

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password,
    database: process.env.DB_NAME || 'sistrackv2',
  });

  // Buat tabel tracking migrasi
  await db.execute(`CREATE TABLE IF NOT EXISTS _migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    run_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Baca file SQL bernomor urut
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('❌ Folder database/migrations/ tidak ditemukan.');
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('ℹ️  Tidak ada file migrasi SQL untuk dijalankan.');
    await db.end();
    return;
  }

  for (const file of files) {
    const [[row]] = await db.execute('SELECT id FROM _migrations WHERE filename = ?', [file]);
    if (row) {
      console.log(`⏭  Skip: ${file} (sudah pernah dijalankan)`);
      continue;
    }

    const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    // Jalankan multi-statement jika diperlukan
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await db.execute(stmt);
    }

    await db.execute('INSERT INTO _migrations (filename) VALUES (?)', [file]);
    console.log(`✅ Ran: ${file}`);
  }

  await db.end();
  console.log('🎉 Migrasi selesai.');
}

run().catch(e => {
  console.error('❌ Migration error:', e.message);
  process.exit(1);
});
