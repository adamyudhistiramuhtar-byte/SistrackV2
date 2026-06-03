# Dokumentasi Implementasi Load Balancer & Pemenuhan Standar Tugas Besar

Dokumen ini disusun sebagai panduan komprehensif dan bahan presentasi untuk membuktikan bahwa proyek **SistrackV2** telah 100% memenuhi dan bahkan melampaui standar Tugas Besar Cloud Computing.

---

## BAGIAN 1: STATUS PEMENUHAN KETENTUAN TUGAS BESAR

Berdasarkan pengumuman Tugas Besar, berikut adalah evaluasi *checklist* pemenuhan syarat proyek ini:

| Persyaratan Tugas Besar | Status | Implementasi di Proyek SistrackV2 |
| :--- | :---: | :--- |
| **Deployment ke Layanan Cloud** | ✅ SELESAI | Aplikasi di-deploy menggunakan **Microsoft Azure** (Azure for Students). |
| **Gunakan Aplikasi Lama** | ✅ SELESAI | Menggunakan proyek **SistrackV2** yang direfaktor menjadi arsitektur berbasis *Microservices*. |
| **1. Web Server** | ✅ SELESAI | Menggunakan **Nginx** sebagai Web Server (Reverse Proxy) & Node.js untuk mengeksekusi logika backend. |
| **2. Database Server** | ✅ SELESAI | Menggunakan layanan PaaS **Azure Database for MySQL Flexible Server**, terpisah dari Web Server untuk skalabilitas data independen. |
| **3. Load Balancer** | ✅ SELESAI | Menerapkan arsitektur **Hybrid Load Balancing** Lapis 7 (Application Layer) menggunakan Nginx dan modul Cluster PM2 (Detail di Bagian 2). |
| **Akses Online Publik** | ✅ SELESAI | Aplikasi terikat (bind) pada IP Public VM Azure dan port HTTP (80), sehingga dapat diakses oleh publik secara global. |

**KESIMPULAN:** Proyek ini **SUDAH SANGAT MEMENUHI STANDAR**. Proyek ini tidak menggunakan infrastruktur monolitik sederhana, melainkan menggunakan pola desain arsitektur modern (Virtual Networks terisolasi, Microservices gRPC/REST, dan Process Load Balancing), yang akan memberikan nilai *plus* di mata Dosen.

---

## BAGIAN 2: DOKUMENTASI KOMPLEKS IMPLEMENTASI LOAD BALANCER

Berbeda dengan proyek konvensional yang mungkin menggunakan Azure Application Gateway (yang berbiaya sangat mahal), proyek ini mendemonstrasikan pemahaman mendalam tentang *Application-Level Load Balancing*. 

Kami mengimplementasikan **Two-Tier Hybrid Load Balancing (Load Balancing 2 Lapis)** yang sangat efisien dan lazim digunakan di *startup* teknologi modern:

### Lapis 1: Nginx sebagai L7 Reverse Proxy Load Balancer
Nginx dipasang di garda terdepan (port 80) sebagai *Reverse Proxy* dan *Load Balancer* statis. 
- **Tugas Utama**: Menerima seluruh trafik (HTTP/WebSockets) dari internet luar.
- **Routing Cerdas**: Nginx memilah *request*. Jika *request* menuju `/`, beban diarahkan ke *frontend* (file Vue statis). Jika *request* menuju `/api/`, trafik diteruskan (proxy pass) secara internal ke *Gateway Microservice*.
- **Efisiensi**: Membebaskan *backend* Node.js dari melayani gambar atau file statis, sehingga performa *backend* fokus penuh pada pengolahan API (komputasi data).

### Lapis 2: PM2 Internal Cluster Module (Node.js Native Load Balancing)
Node.js secara bawaan bekerja secara *Single-Threaded* (satu jalur proses). Ini menjadi masalah *bottleneck* jika banyak pesanan (*order*) masuk bersamaan. Untuk mengatasi ini, kita menggunakan **PM2 Process Manager dengan Cluster Mode**.
- **Mekanisme**: Di dalam file `ecosystem.config.js`, konfigurasi `gateway` (layanan utama yang menerima semua trafik dari Nginx) diubah ke `exec_mode: 'cluster'` dengan `instances: 2` (atau 'max').
- **Algoritma Load Balancing**: PM2 mengambil alih *port binding*. Saat *request* HTTP datang dari Nginx ke Port 3000, **PM2 (menggunakan algoritma Round-Robin internal TCP)** akan mendistribusikan *request* tersebut secara seimbang di antara *Instance* 1 atau *Instance* 2 dari Gateway API.
- **Dampak Kinerja**: Jika salah satu *instance Gateway* sibuk (misalnya sedang menunggu balasan gRPC dari *Analytics Service*), *request* pesanan dari pelanggan berikutnya tidak akan mengantre (blocked), melainkan langsung ditangkap dan diproses oleh *instance Gateway* kedua.

### Cuplikan Bukti Kode (Evidence untuk Laporan & Demo)

**1. Bukti Konfigurasi PM2 Cluster (ecosystem.config.js)**
Tunjukkan blok kode ini kepada dosen saat mendemonstrasikan Load Balancer:
```javascript
module.exports = {
  apps: [
    {
      name: 'gateway',
      script: './backend/gateway/src/index.js',
      instances: 2,           // <-- INI ADALAH IMPLEMENTASI LOAD BALANCER
      exec_mode: 'cluster',   // <-- MENJALANKAN DUA APLIKASI PARALEL
      watch: false,
      env: { PORT: 3000 },
    },
    // ... microservices lainnya berjalan normal
  ],
};
```

**2. Bukti Konfigurasi Nginx (Reverse Proxy)**
Tunjukkan bagaimana Nginx bertindak sebagai *traffic router*:
```nginx
location /api/ {
    # Meneruskan trafik ke Load Balancer internal PM2 di port 3000
    proxy_pass http://localhost:3000/api/;
    
    # Header khusus agar Real-Time Socket.IO tidak terputus saat di-load balance
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
}
```

---

## BAGIAN 3: PANDUAN MATERI PRESENTASI/DEMO (PITCH DECK)

Gunakan kerangka ini saat Anda presentasi di depan dosen:

1. **Pembukaan**: "Proyek SistrackV2 ini di-deploy menggunakan **Microsoft Azure** dengan pendekatan arsitektur modern yang memisahkan Compute (VM Ubuntu) dan Database (Azure MySQL Flexible Server) demi keamanan dan skalabilitas."
2. **Arsitektur Cloud**: "Kami menempatkan VM kami di *Web Subnet* yang bisa diakses publik, namun meletakkan Azure MySQL kami di *Private Subnet (VNet Integration)* sehingga Mustahil ditembus dari luar internet."
3. **Pembagian Layanan**: "Tidak seperti aplikasi biasa, *backend* Node.js kami kami pecah menjadi 6 buah *Microservices* (Gateway, Auth, Order, Product, Notification, dan Analytics). Mereka berkomunikasi secara terisolasi, bahkan menggunakan protokol gRPC untuk kecepatan tinggi."
4. **Implementasi Load Balancer**: "Untuk Load Balancer, kami menggunakan dua lapisan. Nginx di depan sebagai penyeimbang beban L7/Reverse Proxy, yang kemudian melempar trafik ke API Gateway. API Gateway sendiri dikonfigurasi menggunakan **PM2 Cluster Mode (Internal Load Balancer)** dengan algoritma Round-Robin, sehingga melipatgandakan kemampuan VM kami melayani pesanan restoran tanpa hambatan (*bottleneck*)."
5. **Penutup/Demo**: Tunjukkan layar *browser* aplikasi yang bisa diakses dari IP Cloud, lalu tunjukkan terminal dengan mengetik `pm2 status` untuk memperlihatkan bahwa aplikasi `gateway` memiliki **2 baris id** (bukti nyata *load balancing* sedang berjalan).
