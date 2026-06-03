# [LAYER 2] Dokumentasi Improvement Project

## 1. Executive Summary
Berdasarkan tinjauan arsitektur eksisting SistrackV2 (Layer 1), sistem telah mengadopsi konsep dasar **Microservices**. Namun, penerapannya masih belum ideal (*anti-pattern* di beberapa bagian, seperti *Shared Database*). Dokumen ini menyajikan rencana strategis (*Improvement Project*) untuk meningkatkan skalabilitas, keandalan (*reliability*), dan kemudahan pemeliharaan (*maintainability*) dari aplikasi ini.

---

## 2. Identifikasi Masalah & Bottleneck Saat Ini

1. **Shared Database Anti-Pattern**
   - Saat ini, `auth-service`, `product-service`, dan `order-service` semuanya terhubung ke satu *database* fisik MySQL yang sama (`sistrackv2`). 
   - *Dampak*: Kegagalan pada *database* ini akan menyebabkan *Single Point of Failure (SPOF)* untuk seluruh *service*, yang menghilangkan keunggulan utama arsitektur *microservices*.
2. **Kinerja Pengambilan Data (Read-heavy operations)**
   - API katalog produk dan menu (yang sangat sering diakses oleh *Customer*) selalu menembak langsung ke MySQL. Pada jam sibuk (jam makan siang/malam), hal ini bisa menyebabkan penumpukan antrean koneksi ke basis data.
3. **Keamanan di Level Gateway Kurang Optimal**
   - API Gateway saat ini hanya bertindak sebagai *reverse proxy* (`http-proxy-middleware`) dan memiliki pengecekan JWT yang sederhana. Tidak ada mekanisme pencegahan *DDoS* atau *Brute-force* seperti *Rate Limiting*.
4. **Komunikasi Antar Service yang Synchronous (REST/Axios)**
   - Ketika pesanan dibuat (`Order Service`), komunikasi sinkron *HTTP* mungkin memperlambat respons dan rentan *timeout* jika *service* lain sedang sibuk atau *down*.

---

## 3. Proposed Improvements (Inisiatif Perbaikan)

### 3.1 Peningkatan Arsitektur Data
- **Database per Service (Isolation)**
  - Pisahkan skema database:
    - `sistrackv2_auth` untuk *Auth Service*.
    - `sistrackv2_product` untuk *Product Service*.
    - `sistrackv2_order` untuk *Order Service*.
  - *Data Synchronization* antara order dan product (misalnya validasi stok/harga saat *checkout*) akan dilakukan via panggilan gRPC antar-service, bukan via JOIN di level database.
- **Implementasi Caching Layer (Redis)**
  - Terapkan Redis di dalam `product-service`.
  - Simpan daftar produk (*available products*) di *cache*. Ketika ada pembaruan produk oleh Admin, hapus (*invalidate*) *cache* tersebut. Hal ini akan memangkas beban MySQL hingga 80-90% pada rute publik.

### 3.2 Peningkatan Keamanan & Reliabilitas (API Gateway)
- **Rate Limiting & Throttling**
  - Menggunakan *library* seperti `express-rate-limit` di API Gateway untuk membatasi jumlah *request* dari IP yang sama dalam durasi waktu tertentu.
- **Circuit Breaker Pattern**
  - Implementasikan `opossum` atau *library circuit breaker* sejenis di level Gateway atau saat komunikasi antar-*service* (via Axios/gRPC). Ini memastikan jika satu *service down*, *request* berikutnya akan digagalkan dengan cepat (*fail-fast*) untuk menghemat *resources* daripada menunggu *timeout*.

### 3.3 Pembaruan Infrastruktur Kode (*Codebase*)
- **Migrasi ke TypeScript**
  - Ubah basis kode `.js` yang ada di *backend* secara bertahap menjadi `.ts`. Ini akan memberikan *type safety* yang kuat untuk *payload request*, respons API, dan struktur basis data.
- **Asynchronous Messaging (Message Broker)**
  - Perkenalkan **RabbitMQ** atau **Apache Kafka**.
  - Kasus Penggunaan: Saat `order-service` berhasil memproses pesanan baru, ia mempublikasikan *event* `OrderCreated`. `notification-service` atau *service* lain dapat mendengarkan (*subscribe*) *event* ini untuk segera merespons tanpa harus di-ping secara langsung (*loose coupling*).

---

## 4. Roadmap Implementasi (Fase Pengembangan)

**Fase 1: Quick Wins (Minggu 1-2)**
- [ ] Implementasi Redis *caching* di `product-service`.
- [ ] Penambahan *Rate Limiting* di API Gateway.
- [ ] Penambahan standar *Logger* (ELK Stack siap) pada `shared` modul.

**Fase 2: Pemisahan Data & Type Safety (Minggu 3-6)**
- [ ] Inisialisasi basis kode TypeScript di *service* baru atau yang di-refactor.
- [ ] Migrasi database: Pecah `sistrackv2` menjadi `_auth`, `_product`, `_order`.
- [ ] Penyesuaian `db.js` pada masing-masing *service* untuk menunjuk ke database terisolasi.
- [ ] Penggantian komunikasi sinkron gRPC antar *service* untuk keperluan validasi harga produk di *order*.

**Fase 3: Full Distributed System (Minggu 7-8)**
- [ ] Setup RabbitMQ dan integrasi implementasi *Event-Driven Architecture*.
- [ ] Pembuatan `analytics-service` yang mengumpulkan log data berdasarkan *event streaming* bukan lagi query *direct* ke MySQL.
- [ ] Implementasi *Circuit Breaker* secara menyeluruh.
