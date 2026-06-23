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

  // Bersihkan data lama agar tidak duplikat
  await db.execute('SET FOREIGN_KEY_CHECKS = 0');
  await db.execute('TRUNCATE TABLE products');
  await db.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('🗑️  Tabel products dibersihkan');

  // Seed 50 menu unik
  const products = [
    // ═══════════ MAKANAN BERAT (20) ═══════════
    ['Nasi Goreng Spesial', 'Nasi goreng dengan telur mata sapi, ayam suwir, dan kerupuk udang', 25000, 'Makanan'],
    ['Mie Goreng Jawa', 'Mie goreng bumbu kecap manis dengan sawi dan tauge', 22000, 'Makanan'],
    ['Ayam Bakar Taliwang', 'Ayam bakar khas Lombok dengan sambal plecing pedas', 35000, 'Makanan'],
    ['Sate Ayam Madura', 'Sepuluh tusuk sate ayam dengan bumbu kacang dan lontong', 30000, 'Makanan'],
    ['Soto Betawi', 'Soto kuah santan dengan daging sapi, kentang, dan tomat', 32000, 'Makanan'],
    ['Nasi Padang Rendang', 'Nasi putih dengan rendang sapi, daun singkong, dan sambal hijau', 38000, 'Makanan'],
    ['Ayam Penyet Sambal Cobek', 'Ayam goreng dipenyet dengan sambal bawang pedas', 27000, 'Makanan'],
    ['Nasi Uduk Betawi', 'Nasi uduk komplit dengan ayam goreng, tempe orek, dan telur balado', 26000, 'Makanan'],
    ['Gado-Gado Surabaya', 'Sayuran rebus segar dengan bumbu kacang kental dan kerupuk', 20000, 'Makanan'],
    ['Bakso Urat Jumbo', 'Bakso urat sapi besar dengan kuah kaldu dan mie kuning', 25000, 'Makanan'],
    ['Mie Ayam Pangsit', 'Mie ayam dengan pangsit goreng dan ayam cincang jamur', 18000, 'Makanan'],
    ['Pecel Lele Lamongan', 'Lele goreng krispi dengan sambal terasi dan lalapan', 22000, 'Makanan'],
    ['Gurame Asam Manis', 'Ikan gurame goreng filet dengan saus asam manis segar', 65000, 'Makanan'],
    ['Udang Saus Padang', 'Udang tiger segar tumis saus padang pedas gurih', 55000, 'Makanan'],
    ['Cumi Goreng Tepung', 'Cumi ring goreng tepung krispi dengan saus tartar', 45000, 'Makanan'],
    ['Kwetiau Goreng Seafood', 'Kwetiau goreng dengan udang, cumi, dan bakso ikan', 28000, 'Makanan'],
    ['Nasi Liwet Solo', 'Nasi liwet santan dengan ayam suwir, telur pindang, dan labu siam', 27000, 'Makanan'],
    ['Iga Bakar Madu', 'Iga sapi bakar glaze madu dengan coleslaw segar', 58000, 'Makanan'],
    ['Rawon Surabaya', 'Rawon daging sapi kuah hitam kluwek dengan tauge dan telur asin', 33000, 'Makanan'],
    ['Nasi Kuning Manado', 'Nasi kuning dengan cakalang fufu, perkedel, dan abon', 28000, 'Makanan'],

    // ═══════════ MINUMAN (18) ═══════════
    ['Es Teh Manis', 'Teh hitam manis segar dingin dengan es batu', 8000, 'Minuman'],
    ['Es Jeruk Peras', 'Air perasan jeruk manis segar dengan es serut', 10000, 'Minuman'],
    ['Kopi Hitam Tubruk', 'Kopi hitam murni seduh tradisional tanpa ampas', 12000, 'Minuman'],
    ['Kopi Susu Gula Aren', 'Es kopi susu kekinian dengan gula aren asli', 18000, 'Minuman'],
    ['Jus Jeruk Segar', 'Jus buah jeruk tanpa pemanis buatan', 15000, 'Minuman'],
    ['Jus Alpukat Coklat', 'Jus alpukat kental dengan sirup coklat dan susu kental', 20000, 'Minuman'],
    ['Jus Mangga Harum Manis', 'Jus mangga manis varietas harum manis', 16000, 'Minuman'],
    ['Matcha Latte', 'Es matcha Jepang premium dengan susu segar', 22000, 'Minuman'],
    ['Teh Tarik', 'Teh susu tarik panas berbusa khas Melayu', 12000, 'Minuman'],
    ['Lemon Tea', 'Es teh lemon segar menyegarkan', 12000, 'Minuman'],
    ['Wedang Jahe Sereh', 'Minuman hangat jahe dan sereh dengan gula merah', 10000, 'Minuman'],
    ['Es Campur Tradisional', 'Es serut dengan cendol, cincau, kolang-kaling, dan nangka', 15000, 'Minuman'],
    ['Soda Gembira', 'Susu kental manis dengan soda dan sirup cocopandan', 13000, 'Minuman'],
    ['Air Mineral', 'Air mineral dalam kemasan 600ml', 5000, 'Minuman'],
    ['Es Kelapa Muda', 'Air kelapa muda segar dengan daging kelapa', 15000, 'Minuman'],
    ['Americano Ice', 'Espresso double shot dengan air dingin', 16000, 'Minuman'],
    ['Chocolate Milkshake', 'Milkshake coklat kental dengan whipped cream', 22000, 'Minuman'],
    ['Thai Tea', 'Teh Thailand manis dengan susu evaporasi dan es', 15000, 'Minuman'],

    // ═══════════ CAMILAN (8) ═══════════
    ['Kentang Goreng Crispy', 'Kentang goreng renyah dengan saus sambal dan mayones', 15000, 'Camilan'],
    ['Pisang Goreng Keju Susu', 'Pisang goreng krispi dengan topping keju dan susu kental', 18000, 'Camilan'],
    ['Roti Bakar Coklat Keju', 'Roti bakar empuk isi coklat lumer dan keju meleleh', 16000, 'Camilan'],
    ['Singkong Keju Merekah', 'Singkong goreng merekah renyah dengan keju parut', 15000, 'Camilan'],
    ['Tahu Cabe Garam', 'Tahu krispi goreng dengan bumbu cabe garam pedas', 18000, 'Camilan'],
    ['Cireng Isi Ayam', 'Aci goreng krispi berisi ayam suwir bumbu rujak', 14000, 'Camilan'],
    ['Dimsum Ayam Udang', 'Lima buah dimsum kukus isi ayam dan udang', 20000, 'Camilan'],
    ['Lumpia Semarang', 'Lumpia goreng isi rebung dan udang khas Semarang', 16000, 'Camilan'],

    // ═══════════ DESSERT (4) ═══════════
    ['Pancake Matcha Ice Cream', 'Pancake fluffy matcha dengan es krim vanila dan mochi', 28000, 'Dessert'],
    ['Es Krim Sundae Coklat', 'Tiga scoop es krim coklat dengan saus karamel dan kacang', 22000, 'Dessert'],
    ['Pisang Bakar Madu', 'Pisang raja bakar dengan madu, keju, dan es krim vanila', 20000, 'Dessert'],
    ['Puding Karamel', 'Puding susu lembut dengan saus karamel homemade', 15000, 'Dessert'],
  ];

  for (const [name, description, price, category] of products) {
    await db.execute(
      'INSERT INTO products (name, description, price, category) VALUES (?,?,?,?)',
      [name, description, price, category]
    );
  }
  console.log(`✅ ${products.length} produk unik berhasil ditambahkan`);

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
