# SistrackV2 (Microservices Ordering System)

SistrackV2 adalah aplikasi manajemen reservasi kursi dan pemesanan makanan (*Ordering and Seating System*) berarsitektur **Microservices**. Proyek ini dikembangkan dengan memisahkan domain bisnis menjadi beberapa layanan mandiri yang terhubung via REST API, gRPC, dan WebSockets, guna menjamin skalabilitas dan ketersediaan tinggi (*High Availability*).

## 🚀 Fitur Utama

- **Customer Flow**: Pemesanan tempat duduk mandiri (Self-Service Seating) terproteksi dengan JWT Session untuk meminimalisasi order palsu.
- **Admin Dashboard**: Manajemen produk (katalog menu) dan pemantauan order secara *real-time*.
- **Real-time Notifications**: Menggunakan Socket.IO agar perubahan status pesanan otomatis tampil di layar pelanggan tanpa me-*refresh* browser.
- **High Performance Analytics**: Agregasi data penjualan dilakukan di *Analytics Service* via gRPC untuk mencegah beban berlebih di *Order Service*.
- **Security First**: Dilengkapi dengan *Rate Limiting* (cegah DDoS/Bruteforce), validasi payload (*express-validator*), *Helmet* (Security Headers), dan CORS terkonfigurasi.

## 🏗️ Struktur Microservices

Proyek ini terbagi menjadi 6 layanan (*services*) di sisi Backend:
1. **API Gateway** (Port 3000): Gerbang utama, *Reverse Proxy*, dan penanganan *Rate Limiting*.
2. **Auth Service** (Port 3001): Autentikasi Admin dan *JWT issuer*.
3. **Product Service** (Port 3002): Pengelolaan katalog menu dan ketersediaan stok.
4. **Order Service** (Port 3003): *State Machine* untuk pesanan dan *Session* tempat duduk.
5. **Notification Service** (Port 3004): Layanan WebSocket (Socket.IO) untuk notifikasi *real-time*.
6. **Analytics Service** (Port 50051 & HTTP): Pelaporan statistik transaksi (menggunakan gRPC client-server).

## 📚 Dokumentasi Lengkap

Seluruh dokumen rincian (*Documentation-as-Code*) tersedia di dalam folder `/docs`:

1. **[Dokumentasi Proyek Existing (README Lengkap)](docs/01-existing-project/README.md)**
   Berisi spesifikasi teknologi lengkap, skema *database*, ERD, dan dokumentasi API.
2. **[Daftar Perbaikan / Improvements](docs/02-improvement/IMPROVEMENT.md)**
   Rincian 16 fitur peningkatan sistem (Security, Logic, Testing) yang telah berhasil diimplementasikan.
3. **[Panduan Cloud Computing (Azure)](docs/TUGAS_BESAR_WORKFLOW.md)**
   SOP lengkap dari titik nol (0) untuk men-*deploy* aplikasi Microservices ini ke Microsoft Azure for Students.

## ⚙️ Cara Menjalankan Secara Lokal

Sistem telah dilengkapi modul instalasi yang mudah dijalankan. Pastikan **Node.js (v18+)** dan **MySQL** telah siap di laptop Anda.

```bash
# 1. Install Dependensi Root
npm install

# 2. Setup Database & Seeding Dummy Data (Buat Schema DB di lokal Anda lebih dulu)
npm run db:migrate
npm run db:seed

# 3. Jalankan Semua Microservices (Backend) & Frontend Vue 3 secara bersamaan
npm run dev:backend
npm run dev:frontend
```

## 🧪 Testing
Kami menggunakan kerangka kerja otomasi tes:
- **Backend**: Jest In-memory (Jalankan: `npm run test:backend`)
- **Frontend**: Vitest (Jalankan: `npm run test:frontend`)
