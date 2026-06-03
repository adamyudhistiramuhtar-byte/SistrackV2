# LAYER 2 — DOKUMENTASI IMPROVEMENT PROJECT

Dokumen ini memuat usulan dan implementasi perbaikan (*improvements*) yang telah dikerjakan secara utuh pada proyek SistrackV2. Semua temuan di bawah ini telah bersatus **[COMPLETED]** dan sukses diintegrasikan ke *codebase* utama.

---

## SPRINT 1: SECURITY & STABILITY

### IMP-001: Environment Variable Validation
**Kategori**: Security & Stability | **Status**: COMPLETED
**Implementasi**: Membuat modul `shared/validateEnv.js` yang menghentikan proses *startup* server jika environment variables penting seperti kredensial Database dan JWT Secret tidak ada atau tidak memenuhi standar keamanan produksi.

### IMP-002: Input Validation via Express-Validator
**Kategori**: Security | **Status**: COMPLETED
**Implementasi**: Menambahkan skema validasi `express-validator` pada `auth.validator.js` (Login) dan `order.validator.js` (Pembuatan Order) guna memblokir payload berbahaya dan malformated data sebelum menyentuh layer Service atau Database.

### IMP-003: Rate Limiting & Throttling
**Kategori**: Security | **Status**: COMPLETED
**Implementasi**: Mencegah serangan *Brute-Force* dan *DDoS* sederhana melalui modul `shared/rateLimiter.js`. Terdapat tiga tingkatan: `authLimiter` (ketat), `writeLimiter` (sedang untuk Order), dan `readLimiter` (longgar untuk Katalog Produk).

### IMP-004: Security Headers & CORS Configuration
**Kategori**: Security | **Status**: COMPLETED
**Implementasi**: Menghapus CORS Wildcard (`*`) dan membatasinya melalui `process.env.ALLOWED_ORIGINS` di API Gateway. Memasang pustaka `helmet` untuk memperkeras header HTTP secara otomatis.

### IMP-005: Database Migration System
**Kategori**: Code Quality | **Status**: COMPLETED
**Implementasi**: Membuat script custom migration `database/migrate.js` yang melacak eksekusi migrasi menggunakan tabel metadata `_migrations`, memastikan sinkronisasi skema DB (001-007) secara konsisten di seluruh lingkungan.

### IMP-006: Ecosystem Config PM2 & Concurrently
**Kategori**: DevOps & Scalability | **Status**: COMPLETED
**Implementasi**: Mendefinisikan `ecosystem.config.js` untuk menjalankan ke-6 microservices dalam satu *cluster* via PM2 di production. Di lokal, konfigurasi *Concurrently* mempermudah developer memutar seluruh service dengan `npm run dev:backend`.

### IMP-007: Centralized Error Handler
**Kategori**: Stability | **Status**: COMPLETED
**Implementasi**: Menghindari *crash* mendadak dan menstandarisasi output pesan error melalui `shared/errorHandler.js` dengan memanfaatkan *custom exception* `AppError`.

---

## SPRINT 2: BUSINESS LOGIC

### IMP-008: Order Status State Machine
**Kategori**: Business Logic | **Status**: COMPLETED
**Implementasi**: Membuat transisi status ketat di `constants/orderStatus.js` (pending -> confirmed -> preparing -> ready -> completed). Memblokir modifikasi tidak valid dari admin.

### IMP-009: Admin Order Management (CRUD)
**Kategori**: Feature | **Status**: COMPLETED
**Implementasi**: Melengkapi rute REST API di `order.routes.js` yang menyertakan relasi *Order Items* menggunakan SQL JOIN dan In-Memory Map fallback jika DB gagal.

### IMP-010: Product Catalog Enhancement
**Kategori**: Feature | **Status**: COMPLETED
**Implementasi**: Rute `GET /api/products/available` kini mendukung filter berdasarkan kategori, keyword search, dan *Pagination* (offset/limit). Menambah rute `/categories` untuk filter sidebar dinamis.

---

## SPRINT 3: QUALITY & FEATURES

### IMP-011: Real-time Order Notification (Socket.IO)
**Kategori**: UX & Feature | **Status**: COMPLETED
**Implementasi**: Membangun *real-time events* di `notification-service` yang ditrigger secara *Internal HTTP POST* dari `order-service` setiap kali status pesanan berubah, yang selanjutnya diteruskan ke aplikasi Vue.js melalui custom composable `useOrderSocket.js`.

### IMP-012: Seat Session JWT Token
**Kategori**: Security & Logic | **Status**: COMPLETED
**Implementasi**: Daripada menerima `seatNumber` sebagai integer telanjang dari client (yang rentan manipulasi), sistem kini mengharuskan customer untuk *checkout* dengan `X-Session-Token` berisi nomor meja yang ditandatangani oleh JWT Secret.

### IMP-013: Backend Unit Testing (Jest)
**Kategori**: Quality Assurance | **Status**: COMPLETED
**Implementasi**: Setup modul `jest.config.js` dan unit test pertama `auth.service.test.js` dengan fungsi *mocking* ke layer koneksi database untuk menguji isolasi logika otentikasi admin.

### IMP-014: Frontend Unit Testing (Vitest)
**Kategori**: Quality Assurance | **Status**: COMPLETED
**Implementasi**: Melengkapi `vite.config.js` dengan kapabilitas *Vitest* beserta pengujian `formatCurrency.test.js` pada *helper* utilitas frontend Vue.

### IMP-015: Analytics Service Integration (gRPC)
**Kategori**: Scalability | **Status**: COMPLETED
**Implementasi**: Menggunakan kontrak Protobuf (`analytics.proto`) dan *gRPC channel* agar Gateway dapat secara kencang mem-*fetch* ringkasan data finansial (GetDashboardSummary) tanpa mengganggu operasi basis data *Order Service*.

### IMP-016: Seed Data & Admin Setup CLI
**Kategori**: DevOps | **Status**: COMPLETED
**Implementasi**: Skrip `database/seeds/seed.js` untuk langsung menjejali *database* (seeding) dengan menu makanan dummy, 12 kursi, serta akun kredensial Administrator yang di-*hash* via Bcrypt.
