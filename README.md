# 🍽️ SisTrackV2 - Enterprise Ordering & Seating Management System

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg?cacheSeconds=2592000)
![Architecture](https://img.shields.io/badge/architecture-microservices-orange.svg)
![Vue](https://img.shields.io/badge/Vue.js-3.5-4FC08D.svg?logo=vue.js)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933.svg?logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg?logo=mysql)
![gRPC](https://img.shields.io/badge/gRPC-Enabled-244C5A.svg?logo=grpc)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101.svg?logo=socket.io)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

**SisTrackV2** adalah sebuah sistem manajemen restoran modern berskala *enterprise* yang memfasilitasi pelanggan untuk memesan kursi dan hidangan secara mandiri (*self-service*), serta menyediakan panel Dasbor Admin yang canggih untuk pemantauan penjualan *real-time*. 

Sistem ini didesain menggunakan pola arsitektur **Microservices** yang terdistribusi secara independen, memisah domian kompleks menjadi enam layanan berkinerja tinggi yang berkomunikasi asinkron via gRPC dan REST, demi memastikan ketersediaan tinggi (*High Availability*) dan ketahanan yang absolut.

---

## 🌟 Daftar Fitur Unggulan

- **🔐 Robust Security System**: Mengimplementasikan *Helmet* untuk HTTP Header dinamis, mitigasi eksploitasi berbasis CORS dengan spesifikasi *Allowed Origins* berlapis, validasi input agresif via `express-validator`, serta 3 lapis perlindungan *Rate Limiting* guna menetralisir ancaman *Brute-Force* dan serangan DDoS.
- **🛡️ Secure Seat Session Authentication**: Sistem *checkout* inovatif berbasis Token JWT (JSON Web Token) yang mengikat sesi pengguna secara kryptografik dengan nomor meja, mencegah manipulasi payload POST yang merugikan pesanan pengguna lain.
- **⚡ Real-Time Notification Engine**: Dibangun di atas WebSocket (Socket.IO) yang di-trigger oleh Internal HTTP. Mampu mem-push *updates* status pesanan kepada perangkat pelanggan tanpa memerlukan metode *polling* yang berat, mengurangi beban *network* 80%.
- **📊 High-Performance Analytics (gRPC)**: Menyajikan agregasi laporan pendapatan harian secara *blazing fast*. Integrasi antara *API Gateway* dan *Analytics Service* dijamin menggunakan `Protobuf` (Protocol Buffers) dan RPC, yang secara logikal terisolasi dari *Order Service* untuk menghindari potensi *bottleneck* DB.
- **🚦 Smart State Machine**: Logika pesanan yang dijamin secara terstruktur `(pending -> confirmed -> preparing -> ready -> completed)` agar *state* sistem tetap *pure* dan menghindari mutasi data yang ilegal oleh Admin.
- **🛠️ Automated Database DevOps**: Dilengkapi skrip kustom untuk sinkronisasi Database Migrations dan Seeder cerdas, yang menjamin replikasi skema seragam mulai dari *Local* hingga *Azure Cloud*.

---

## 🏛️ Arsitektur Sistem (Microservices)

Sistem Backend di-deploy secara komprehensif menggunakan modul **PM2 Ecosystem**, yang merutekan interaksi antar *service* dalam infrastruktur lokal (*localhost*) maupun di VNet Azure.

```mermaid
graph TD
    %% Entitas Eksternal
    Client[("💻 Browser Client (Vue 3)")]
    
    %% API Gateway Layer
    Gateway{"🛡️ API Gateway (Port 3000)\nReverse Proxy & Rate Limiter"}
    
    %% Microservices Layer
    subgraph "Microservices Cluster"
        Auth["🔑 Auth Service (:3001)\nJWT & Admin Credentials"]
        Product["🍔 Product Service (:3002)\nMenu, Category, Stok"]
        Order["🛒 Order Service (:3003)\nState Machine & Session"]
        Notif["🔔 Notification Service (:3004)\nWebSocket & Socket.io"]
        Analytics["📈 Analytics Service\n(HTTP:3006 | gRPC:50051)"]
    end
    
    %% Database Layer
    DB[("🗄️ Shared MySQL DB\n(sistrackv2)")]

    %% Jalur Komunikasi
    Client <==>|HTTPS REST| Gateway
    Client <==>|WebSocket WSS| Notif
    
    Gateway ==>|Proxy /api/auth| Auth
    Gateway ==>|Proxy /api/products| Product
    Gateway ==>|Proxy /api/orders & /api/session| Order
    Gateway -.->|gRPC Channel (Protobuf)| Analytics
    
    Order -.->|Internal HTTP Trigger| Notif
    
    Auth ===> DB
    Product ===> DB
    Order ===> DB
    Analytics ===> DB
```

---

## 📁 Pemetaan Repositori (Folder Structure)

Proyek ini menggunakan filosofi *Monorepo* yang mewadahi selurh basis *Backend*, *Frontend*, dan *DevOps Script* dalam satu rumah logikal.

```text
SistrackV2/
├── backend/                       # ⚙️ Lapisan Microservices Node.js/Express
│   ├── analytics-service/         # Service gRPC (Port 50051) untuk agregasi data BI
│   ├── auth-service/              # Manajer Kredensial & Autentikasi (Bcrypt)
│   ├── gateway/                   # Ingress Controller kustom berbasis http-proxy-middleware
│   ├── notification-service/      # WebSocket Server untuk real-time sync
│   ├── order-service/             # Puncak logika bisnis transaksi
│   ├── product-service/           # Modul katalog produk
│   └── shared/                    # Utilitas terpusat (Logger, validateEnv, errorHandler)
│
├── frontend/                      # 🎨 Lapisan UI Client (Vue 3 + Vite)
│   ├── src/
│   │   ├── api/                   # Konfigurasi Axios Interceptors & Socket.IO client
│   │   ├── components/            # Atomic Design Component Library
│   │   ├── layouts/               # Template spesifik untuk Dashboard vs Customer
│   │   └── pages/                 # Logika antarmuka spesifik per Route
│   └── vite.config.js             # Konfigurasi Build Pipeline + Vitest
│
├── database/                      # 🗃️ Lapisan Automasi Data
│   ├── migrations/                # Schema Definition (001_create_admins.sql, dsb)
│   ├── seeds/                     # Data dummy siap pakai untuk Testing
│   └── migrate.js                 # Runner migrasi SQL khusus
│
├── docs/                          # 📖 Standardisasi Dokumentasi Enterprise
│   ├── 01-existing-project/       # Rincian API Endpoint dan ERD
│   ├── 02-improvement/            # Bukti log perbaikan keamanan & skalabilitas
│   └── 03-cloud-computing/        # Cloud Azure Provisioning & Deployment Workflow
│
└── ecosystem.config.js            # 🎛️ Manifes PM2 (Process Manager) Cluster
```

---

## 🚀 Panduan Memulai Cepat (*Quick Start*)

Sistem dirancang untuk proses orientasi yang sangat lancar (*frictionless onboarding*).

### 1. Prasyarat Sistem
- **Node.js** (v18.x LTS direkomendasikan)
- **MySQL Server** (v8.0+)
- **PM2** (Instalasi global: `npm install -g pm2`)

### 2. Kloning & Instalasi
```bash
git clone https://github.com/adamyudhistiramuhtar-byte/SistrackV2.git
cd SistrackV2

# Menginstal dependensi root secara ajaib akan men-trigger seluruh service backend & frontend
npm install
```

### 3. Basis Data
Buat dahulu pangkalan data kosong bernama `sistrackv2` di MySQL Anda.
Lalu jalankan automasi ini dari folder root proyek:
```bash
# Otomatis mereplikasi 7 relasi tabel kompleks
npm run db:migrate

# Mengisinya dengan daftar menu, akun Admin, dan kursi restoran
npm run db:seed
```

### 4. Eksekusi Pengembangan Lokal (Development)
Kami mengadopsi `concurrently` di tingkat backend agar Anda tidak perlu membuka 6 terminal yang berbeda.
```bash
# Menyalakan 6 Microservices (Terminal 1)
npm run dev:backend

# Menyalakan Frontend Vue Vite (Terminal 2)
npm run dev:frontend
```
> **Akses Frontend**: `http://localhost:5173`
> **Akses API**: `http://localhost:3000/api/...`

---

## 🛠️ Modul Skrip Pintar (NPM Scripts)

Root `package.json` dipersenjatai dengan *macro* produktivitas berikut:

| Perintah | Deskripsi Tindakan Eksekusi |
| :--- | :--- |
| `npm run start` | Memutar keenam service Backend di *background* mode PM2 untuk *Production*. |
| `npm run stop` | Mematikan seluruh proses daemon PM2 yang berasosiasi dengan proyek ini. |
| `npm run db:migrate` | Mengeksekusi file SQL yang belum direkam oleh tabel kontrol migrasi. |
| `npm run dev:backend` | Memutar *nodemon* untuk keenam service secara paralel dengan warna log berbeda. |
| `npm run test:backend`| Mengeksekusi Jest In-Memory Test Suite (Mocking Database Layer). |
| `npm run test:frontend`| Mem-booting `jsdom` Vitest untuk komponen Vue dan fungsi Utilitas. |

---

## 🗺️ Panduan Arsitektur Mendalam (Deeper Dive)

Proyek ini telah terdokumentasi setara dengan *Corporate Standard Documentation*. Apabila Anda memerlukan detail lebih dalam seputar parameter API, interaksi gRPC, ERD skema Database, maupun panduan cara mereplikasi proyek ini di *Cloud*, silakan tinjau Pustaka Pengetahuan kami di direktori `/docs`:

👉 [**Dokumentasi Proyek (ERD & Endpoint API)**](docs/01-existing-project/README.md)
👉 [**Log Riwayat Improvement Keamanan**](docs/02-improvement/IMPROVEMENT.md)
👉 [**Standard Operating Procedure Deploy ke Microsoft Azure**](docs/TUGAS_BESAR_WORKFLOW.md)

---
<div align="center">
  <small>Dibuat dengan ❤️ sebagai pemenuhan Tugas Besar Komputasi Awan dan Rekayasa Perangkat Lunak 2026.</small>
</div>
