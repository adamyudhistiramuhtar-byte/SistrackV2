/**
 * validateEnv.js — Shared Environment Variable Validator
 * Dipanggil di startup setiap service sebelum app.listen().
 * Paksa exit(1) jika ada env kritis yang hilang atau nilainya tidak aman.
 */

function validateEnv(requiredKeys) {
  const missing = requiredKeys.filter(k => !process.env[k]);
  if (missing.length) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('   Pastikan file .env sudah ada dan terisi dengan benar.');
    process.exit(1);
  }

  // Validasi keamanan JWT_SECRET
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      console.error('❌ JWT_SECRET terlalu pendek. Minimal 32 karakter untuk keamanan produksi.');
      process.exit(1);
    }
    const weakSecrets = ['supersecret', 'secret', 'password', '123456', 'admin123', 'jwt_secret'];
    if (weakSecrets.includes(process.env.JWT_SECRET.toLowerCase())) {
      console.error('❌ JWT_SECRET menggunakan nilai yang tidak aman untuk production.');
      process.exit(1);
    }
  }

  console.log('✅ Environment variables valid.');
}

module.exports = validateEnv;
