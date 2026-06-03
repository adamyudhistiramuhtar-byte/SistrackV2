/**
 * database/seeds/seed.js — IMP-016: Seed Data & Admin Setup
 * Jalankan: node database/seeds/seed.js
 */
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'backend', 'gateway', '.env') });

async function seed() {
  const rawPassword = (process.env.DB_PASSWORD || '').toString().trim();
  const password = (rawPassword.toLowerCase() === 'no') ? '' : rawPassword;

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password,
    database: process.env.DB_NAME || 'sistrackv2',
  });

  console.log('🌱 Seeding database...');

  // Seed admin
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    || 'admin@sistrackv2.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const hash = await bcrypt.hash(adminPassword, 12);
  await db.execute(
    'INSERT INTO admins (email, password_hash) VALUES (?,?) ON DUPLICATE KEY UPDATE password_hash=?',
    [adminEmail, hash, hash]
  );
  console.log(`✅ Admin: ${adminEmail} / ${adminPassword}`);

  // Seed produk contoh
  const products = [
    ['Nasi Goreng Spesial', 'Nasi goreng dengan telur, ayam, dan sayuran segar', 25000, 'Makanan'],
    ['Mie Goreng', 'Mie goreng dengan bumbu rahasia dapur', 22000, 'Makanan'],
    ['Ayam Bakar', 'Ayam kampung bakar dengan sambal matah', 35000, 'Makanan'],
    ['Es Teh Manis', 'Teh hitam segar dengan es batu', 8000, 'Minuman'],
    ['Jus Jeruk', 'Jus jeruk segar tanpa pengawet', 15000, 'Minuman'],
    ['Air Mineral', 'Air mineral 600ml', 5000, 'Minuman'],
  ];
  for (const [name, description, price, category] of products) {
    await db.execute(
      'INSERT IGNORE INTO products (name, description, price, category) VALUES (?,?,?,?)',
      [name, description, price, category]
    );
  }
  console.log(`✅ ${products.length} produk contoh ditambahkan`);

  // Seed seats (12 kursi)
  for (let i = 1; i <= 12; i++) {
    await db.execute(
      'INSERT IGNORE INTO seats (seat_number, status) VALUES (?, ?)',
      [i, 'available']
    );
  }
  console.log('✅ 12 kursi (seats) ditambahkan');

  await db.end();
  console.log('🎉 Seeding selesai!');
}

seed().catch(e => {
  console.error('❌ Seed error:', e.message);
  process.exit(1);
});
