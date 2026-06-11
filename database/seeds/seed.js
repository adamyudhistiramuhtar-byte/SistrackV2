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
    ['Sate Ayam', 'Sate ayam dengan bumbu kacang khas madura', 30000, 'Makanan'],
    ['Soto Ayam', 'Soto ayam kuah kuning segar dengan koya', 20000, 'Makanan'],
    ['Nasi Padang', 'Nasi putih dengan rendang sapi dan sayur nangka', 35000, 'Makanan'],
    ['Ayam Penyet', 'Ayam goreng dengan sambal penyet super pedas', 27000, 'Makanan'],
    ['Kwetiau Goreng', 'Kwetiau goreng seafood dengan sayuran', 28000, 'Makanan'],
    ['Nasi Uduk', 'Nasi uduk komplit dengan ayam goreng dan telur balado', 26000, 'Makanan'],
    ['Gado-Gado', 'Sayuran segar dengan bumbu kacang kental', 20000, 'Makanan'],
    ['Bakso Urat', 'Bakso urat sapi asli dengan kuah kaldu sapi', 22000, 'Makanan'],
    ['Mie Ayam', 'Mie ayam pangsit dengan potongan ayam jamur', 18000, 'Makanan'],
    ['Pecel Lele', 'Lele goreng krispi dengan sambal terasi', 20000, 'Makanan'],
    ['Nasi Rames', 'Nasi dengan berbagai macam lauk pauk', 25000, 'Makanan'],
    ['Gurame Asam Manis', 'Ikan gurame filet dengan saus asam manis', 65000, 'Makanan'],
    ['Udang Saus Padang', 'Udang segar dengan saus padang pedas gurih', 55000, 'Makanan'],
    ['Cumi Goreng Tepung', 'Cumi ring goreng tepung renyah', 45000, 'Makanan'],
    ['Es Campur', 'Es serut dengan berbagai isian manis', 15000, 'Minuman'],
    ['Es Jeruk Nipis', 'Air perasan jeruk nipis segar', 10000, 'Minuman'],
    ['Kopi Hitam', 'Kopi hitam murni dari biji kopi pilihan', 12000, 'Minuman'],
    ['Kopi Susu Gula Aren', 'Es kopi susu kekinian dengan gula aren aren', 18000, 'Minuman'],
    ['Wedang Jahe', 'Minuman hangat rasa jahe', 10000, 'Minuman'],
    ['Teh Tarik', 'Teh susu panas berbusa', 12000, 'Minuman'],
    ['Lemon Tea', 'Es teh lemon segar', 12000, 'Minuman'],
    ['Jus Alpukat', 'Jus alpukat kental dengan kental manis cokelat', 18000, 'Minuman'],
    ['Jus Mangga', 'Jus buah mangga manis segar', 16000, 'Minuman'],
    ['Soda Gembira', 'Susu kental manis dengan soda dan sirup', 15000, 'Minuman'],
    ['Kentang Goreng', 'Kentang goreng renyah dengan saus sambal', 15000, 'Camilan'],
    ['Pisang Goreng Keju', 'Pisang goreng manis dengan taburan keju', 18000, 'Camilan'],
    ['Roti Bakar Coklat', 'Roti bakar empuk isi coklat lumer', 16000, 'Camilan'],
    ['Singkong Keju', 'Singkong goreng merekah dengan keju parut', 15000, 'Camilan'],
    ['Tahu Cabe Garam', 'Potongan tahu krispi bumbu cabe garam pedas asin', 18000, 'Camilan']
  ];
  for (const [name, description, price, category] of products) {
    await db.execute(
      'INSERT IGNORE INTO products (name, description, price, category) VALUES (?,?,?,?)',
      [name, description, price, category]
    );
  }
  console.log(`✅ ${products.length} produk contoh ditambahkan`);

  // Seed seats (50 kursi)
  for (let i = 1; i <= 50; i++) {
    await db.execute(
      'INSERT IGNORE INTO seats (seat_number, status) VALUES (?, ?)',
      [i, 'available']
    );
  }
  console.log('✅ 50 kursi (seats) ditambahkan');

  await db.end();
  console.log('🎉 Seeding selesai!');
}

seed().catch(e => {
  console.error('❌ Seed error:', e.message);
  process.exit(1);
});
