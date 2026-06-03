require('dotenv').config({ path: '../.env' }); // assuming running from backend dir and .env is at root
// Fallback if .env is not in parent dir, try current dir
require('dotenv').config();

const db = require('./shared/db');

const seedProducts = async () => {
  const products = [
    // Makanan Utama
    { name: 'Ayam Penyet Sambal Ijo', price: 28000, category: 'Makanan' },
    { name: 'Nasi Rames Komplit', price: 30000, category: 'Makanan' },
    { name: 'Sate Ayam Madura (10 tusuk)', price: 25000, category: 'Makanan' },
    { name: 'Bebek Goreng Kremes', price: 35000, category: 'Makanan' },
    { name: 'Soto Betawi Daging', price: 32000, category: 'Makanan' },
    { name: 'Mie Aceh Seafood', price: 38000, category: 'Makanan' },
    { name: 'Nasi Liwet Sunda', price: 27000, category: 'Makanan' },
    { name: 'Iga Bakar Madu', price: 55000, category: 'Makanan' },

    // Minuman
    { name: 'Kopi Susu Aren', price: 18000, category: 'Minuman' },
    { name: 'Teh Tarik Malaka', price: 15000, category: 'Minuman' },
    { name: 'Es Kelapa Muda Jeruk', price: 17000, category: 'Minuman' },
    { name: 'Jus Alpukat Coklat', price: 20000, category: 'Minuman' },
    { name: 'Matcha Latte Dingin', price: 22000, category: 'Minuman' },
    { name: 'Lemon Tea Squash', price: 15000, category: 'Minuman' },

    // Camilan / Dessert
    { name: 'Pisang Goreng Keju Susu', price: 15000, category: 'Camilan' },
    { name: 'Roti Bakar Coklat Kacang', price: 16000, category: 'Camilan' },
    { name: 'Kentang Goreng Sosis', price: 20000, category: 'Camilan' },
    { name: 'Tahu Cabe Garam', price: 18000, category: 'Camilan' },
    { name: 'Pancake Matcha Ice Cream', price: 25000, category: 'Dessert' },
    { name: 'Es Krim Sundae Vanila', price: 15000, category: 'Dessert' }
  ];

  try {
    console.log('Menyisipkan variasi menu ke database...');
    let inserted = 0;
    for (const p of products) {
      // Check if exists
      const [existing] = await db.query('SELECT id FROM products WHERE name = ?', [p.name]);
      if (existing.length === 0) {
        await db.query(
          'INSERT INTO products (name, price, category, is_available) VALUES (?, ?, ?, 1)',
          [p.name, p.price, p.category]
        );
        inserted++;
        console.log(`+ Added: ${p.name}`);
      } else {
        console.log(`- Skipped (already exists): ${p.name}`);
      }
    }
    console.log(`Selesai! Berhasil menambahkan ${inserted} menu baru.`);
  } catch (err) {
    console.error('Gagal melakukan seeding:', err);
  } finally {
    process.exit(0);
  }
};

seedProducts();
