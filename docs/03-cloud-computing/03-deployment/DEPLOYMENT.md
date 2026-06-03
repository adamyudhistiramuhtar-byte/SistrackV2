# PROSES DEPLOYMENT (STANDARD OPERATING PROCEDURE)

Dokumen ini adalah acuan langkah-demi-langkah bagi *Developer/DevOps* untuk merilis versi baru dari aplikasi **SistrackV2** menuju lingkungan *Production*.

── PERSIAPAN DEPLOYMENT ──────────────────────

**Step 1: Persiapan Repository**
Pastikan segala pengujian lokal lolos dan kode telah dimerge ke *branch* utama.
```bash
git checkout main
git pull origin main

# Lakukan test backend & frontend
npm run test:backend
npm run test:frontend

# Build frontend production bundle
cd frontend
npm install
npm run build
```

**Step 2: Akses Cloud Environment**
Sambungkan diri Anda ke Azure VM menggunakan protokol SSH.
```bash
ssh -i ~/.ssh/sistrack_azure.pem ubuntu@[IP_PUBLIC_ATAU_DOMAIN]
```

── DEPLOYMENT WEB SERVER ─────────────────────

**Step 3: Upload Kode ke Server**
(Pendekatan Deployment via Git Pull Manual di Server)
```bash
cd /var/www/sistrack
git checkout main
git pull origin main

# Perbarui dependensi backend jika ada penambahan
cd backend
npm install --production

# Jika build frontend belum dilakukan di CI/CD, lakukan di server
cd ../frontend
npm install
npm run build
```

**Step 4: Restart Aplikasi**
Setelah aset terbaru terpasang, muat ulang layanan Node.js.
```bash
# Merestart layanan API via PM2
pm2 restart ecosystem.config.js

# Verifikasi aplikasi Node berjalan tanpa error
pm2 status
pm2 logs --lines 20

# Restart Nginx jika ada perubahan pada konfigurasi reverse proxy
sudo systemctl restart nginx
```

── DEPLOYMENT DATABASE CHANGES ───────────────

**Step 5: Jalankan Migrasi Database**
```bash
# WAJIB backup database dulu sebelum migrasi schema (jika manual dump)
mysqldump -h sistrack-db-server.mysql.database.azure.com -u app_sistrack -p sistrackv2 > backup_$(date +%Y%m%d).sql

# Terapkan script SQL migrasi secara otomatis
npm run db:migrate

# Opsional: Jika deploy baru, jalankan seeder
npm run db:seed
```

── VERIFIKASI DEPLOYMENT ──────────────────────

**Step 6: Smoke Test Post-Deployment**
- Akses URL dari *browser*: `https://sistrack.domainanda.com`
- Buka Dasbor Admin (`/admin/login`) dan lakukan tes login.
- Tes fungsi *Customer*: Lakukan satu proses `SeatSelect` $\rightarrow$ `Checkout`.
- Eksekusi cURL internal untuk memastikan rute sehat:
  ```bash
  curl -X GET http://localhost:3000/api/health
  # Expected: {"service":"api-gateway","status":"ok"}
  ```

── ROLLBACK PROCEDURE ────────────────────────

JIKA TERJADI MASALAH (System Crash, Bug Kritis Terdeteksi):

```bash
# 1. Kembali ke rilis commit yang stabil sebelumnya
cd /var/www/sistrack
git log --oneline -5
git checkout [hash_commit_stabil_sebelumnya]

# 2. Kembalikan paket npm jika ada ketidakcocokan versi
npm install --production

# 3. Restart layanan
pm2 restart ecosystem.config.js

# 4. Rollback database menggunakan dumpfile backup
mysql -h sistrack-db-server.mysql.database.azure.com -u app_sistrack -p sistrackv2 < backup_2026xxxx.sql
```
