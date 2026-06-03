# Laporan Tugas Besar Cloud Computing: SistrackV2 Enterprise Cloud Architecture

Dokumen ini disusun sebagai laporan akhir dan panduan presentasi pemenuhan Tugas Besar mata kuliah Cloud Computing. Proyek ini menggunakan **SistrackV2** (Sistem Manajemen Restoran) yang di-deploy menggunakan platform **Microsoft Azure** dengan arsitektur enterprise standar industri yang mengutamakan *High Availability*, *Fault Tolerance*, dan *Security*.

---

## 1. Arsitektur Cloud yang Digunakan (Enterprise Grade)

Proyek ini menggunakan arsitektur **Multi-Tier (N-Tier) dengan High Availability**, yang secara fisik dan logis memisahkan antara layer distribusi akses (Load Balancer), layer komputasi (Virtual Machines dalam Availability Set), dan layer data (PaaS Database pada Private Subnet).

**Spesifikasi Detail Arsitektur:**
- **Layer 1: Traffic Distribution & Load Balancing**
  - Menggunakan **Azure Standard Load Balancer** (`sistrack-lb`) yang beroperasi di Layer 4 OSI (TCP).
  - Public IP Statis (`20.24.181.196`) sebagai titik masuk tunggal (*single point of entry*), menyembunyikan topologi jaringan internal dari publik.
  - Distribusi trafik menggunakan algoritma **5-tuple hash** (Source IP, Source Port, Destination IP, Destination Port, Protocol) untuk memastikan distribusi beban komputasi yang *statistically even*.
- **Layer 2: Compute & Application Cluster**
  - Terdiri dari 2 Virtual Machine (`sistrack-web-vm` IP `10.0.0.4` dan `sistrack-web-vm2` IP `10.0.0.5`) yang ditempatkan di dalam satu **Availability Set** (`sistrack-avset`) dengan 2 *Fault Domains* dan 5 *Update Domains*. Ini menjamin SLA 99.95% karena VM berada pada rak server, power supply, dan switch jaringan fisik yang berbeda di datacenter Azure.
  - Kedua VM berjalan secara *stateless*, mengadopsi pola *shared-nothing architecture*.
- **Layer 3: Managed Database (PaaS)**
  - Menggunakan **Azure Database for MySQL Flexible Server** sebagai layanan terkelola (Platform-as-a-Service).
  - Isolasi Keamanan: Fitur Public Access dinonaktifkan sepenuhnya. Database di-deploy menggunakan fitur **VNet Integration / Private Access**, sehingga hanya menerima koneksi internal dari `sistrack-vnet`.

> **[SECTION SCREENSHOT]**
> *(Masukkan gambar diagram arsitektur dari file `docs/cloud-infrastructure/AzureArchitecture.md` atau screenshot arsitektur yang sudah Anda buat)*

---

## 2. Topologi Microservices & Konfigurasi Server

Aplikasi SistrackV2 telah direfaktor sepenuhnya dari arsitektur *Monolithic* menjadi *Microservices*. Total terdapat **6 layanan independen** yang berjalan serentak secara clustering di dalam setiap Virtual Machine.

**Konfigurasi Virtual Machine (Masing-masing VM):**
- **OS:** Canonical Ubuntu Server 22.04 LTS (Jammy Jellyfish) Gen2
- **Compute Size:** Standard_B1s (1 vCPU, 1 GB RAM, Premium SSD)
- **Web Server / Reverse Proxy:** Nginx (Port 80)
- **Process Manager:** PM2 Daemon (Node.js 20 LTS)

**Matrix Microservices (PM2 Cluster):**
| Layanan | Port Internal | Deskripsi Tugas Teknis |
| :--- | :---: | :--- |
| `gateway` | 3000 | API Gateway sentral. Menangani request routing, CORS, dan *Rate Limiting* (DDoS Protection ringan). |
| `auth-service` | 3001 | Modul keamanan. Menerbitkan dan memvalidasi JSON Web Tokens (JWT) dengan skema enkripsi HMAC SHA-256. |
| `product-service` | 3002 | Modul *Inventory*. Mengelola data master menu dan varian menggunakan struktur relasional. |
| `order-service` | 3003 | *Core engine* transaksi. Mengelola status tempat duduk (seats) dan siklus hidup pesanan (Pending -> Completed). |
| `notification-service` | 3004 | Event-driven module. Menggunakan *WebSockets* (Socket.io) untuk *real-time push notifications* ke *client* tanpa *polling*. |
| `analytics-service` | 3005 | *Business Intelligence module*. Mengkomputasi agregat penjualan dan tren harian melalui protokol *gRPC* untuk efisiensi komunikasi antar layanan. |

> **[SECTION SCREENSHOT]**
> *(Masukkan screenshot dari terminal yang menampilkan perintah `pm2 status`, memperlihatkan 6 service berstatus 'online')*

---

## 3. Proses Deployment (End-to-End Migration)

Proses deployment dieksekusi menggunakan pendekatan hibrida: portal GUI untuk visibilitas dan *Command Line Interface* (CLI) untuk automasi.

### 3.1. Provisioning Jaringan & Keamanan (Networking)
1. Inisialisasi Resource Group `Sistrack-RG` di region *Southeast Asia* untuk meminimalisir latensi ke Indonesia.
2. Membangun *Virtual Network* (VNet) `sistrack-vnet` dengan alokasi CIDR blok subnet private `10.0.0.0/24`.
3. Membangun dan memasang **Network Security Group (NSG)** yang bertindak sebagai *Virtual Firewall*. NSG dikonfigurasi dengan aturan mitigasi ketat (*Default Deny All Inbound*), dan hanya membuka:
   - Port `22` (TCP) untuk *Secure Shell* (SSH).
   - Port `80` (TCP) untuk trafik HTTP (berasal dari Load Balancer).

> **[SECTION SCREENSHOT]**
> *(Masukkan screenshot halaman Network Security Group (NSG) Inbound rules di Azure Portal)*

### 3.2. Setup Platform-as-a-Service Database (PaaS)
1. Deployment *Azure Database for MySQL Flexible Server* dengan SKU *Burstable B1ms*.
2. Mengamankan *perimeter* basis data dengan menerapkan **Private DNS Zone** (`sistrack-db.private.mysql.database.azure.com`).
3. Melakukan migrasi *Data Definition Language* (DDL) dan *Data Manipulation Language* (DML) via MySQL Client dari *jump server*.

> **[SECTION SCREENSHOT]**
> *(Masukkan screenshot halaman Overview Azure MySQL Flexible Server atau bagian Networking-nya)*

### 3.3. Instalasi Environment & Web Server (VM-01)
1. Provisioning Virtual Machine pertama (`sistrack-web-vm`) dan melakukan injeksi SSH Public Key ED25519.
2. Instalasi *software stack*: Node.js v20 (via NVM), PM2 secara global, dan Nginx Web Server.
3. *Cloning* sistem dari repositori Git dan melakukan instalasi dependensi secara paralel di setiap sub-direktori *microservices*.
4. *Frontend Build Pipeline*: Menjalankan kompilasi kode React/Vite menjadi file HTML/JS/CSS statis teroptimasi.
5. Inisialisasi Nginx *Reverse Proxy* untuk meneruskan *upgrade header* HTTP/1.1 (diperlukan untuk WebSockets) ke API Gateway internal.

> **[SECTION SCREENSHOT]**
> *(Masukkan screenshot file konfigurasi Nginx `/etc/nginx/sites-available/sistrack` atau terminal instalasi PM2)*

---

## 4. Implementasi Load Balancer & High Availability (HA)

Untuk mencapai ketahanan level *enterprise*, diimplementasikan topologi Load Balancing aktif-aktif.

### 4.1. Pembuatan Availability Set & Replikasi (VM-02)
1. Membuat **Availability Set** (`sistrack-avset`) untuk menghindari kejadian *Single Point of Failure* pada level *hardware rack* di datacenter Microsoft.
2. Melakukan *spawning* VM replika (`sistrack-web-vm2`). VM ini dideploy **tanpa Public IP address** sama sekali, menjadikannya terisolasi sempurna dari internet dan hanya dapat diakses via *Internal VNet Routing*.
3. Sinkronisasi *Environment Variables* (`.env`) ke VM-02 dan melakukan pemutaran *stack* aplikasi via PM2.

> **[SECTION SCREENSHOT]**
> *(Masukkan screenshot halaman Overview VM-02 di Azure Portal yang secara eksplisit menunjukkan "Public IP address: None")*

### 4.2. Konfigurasi Azure Standard Load Balancer (L4)
1. Deployment *Standard SKU Load Balancer* (`sistrack-lb`) dengan *Frontend IP* Statis `20.24.181.196`.
2. Pendefinisian **Backend Pool** yang mengikat *Network Interface Cards* (NIC) dari VM-01 dan VM-02.
3. Pembuatan **Health Probe** (*Keep-alive monitor*). Probe akan menembakkan HTTP GET request ke direktori `/` (port 80) setiap 5 detik. Jika sebuah VM gagal merespon setelah 2 kegagalan berturut-turut (10 detik), VM tersebut ditandai sebagai *Unhealthy*.
4. Pembuatan **Load Balancing Rule** untuk merutekan *ingress traffic* TCP port 80 dari *frontend* ke *backend pool*.

> **[SECTION SCREENSHOT]**
> *(Masukkan screenshot halaman "Load balancing rules" atau "Backend pools" di dashboard Load Balancer)*

---

## 5. Bukti Validasi Akses Aplikasi *Live*

Aplikasi SistrackV2 telah terbukti dapat menahan trafik produksi publik dengan stabil.

1. Pengguna membuka URL IP Load Balancer secara langsung: `http://20.24.181.196`.
2. Aplikasi *Single Page Application* (SPA) React berhasil dimuat dengan *Time to Interactive* (TTI) yang cepat berkat Nginx caching.
3. Modul *Order Service* terhubung mulus ke *Gateway*, memungkinkan reservasi meja (Seat) dan penambahan keranjang secara asinkron.
4. *Analytics Dashboard* memproyeksikan data pendapatan harian yang ditarik via gRPC secara *real-time*.

> **[SECTION SCREENSHOT]**
> *(Masukkan 2-3 screenshot UI aplikasi SistrackV2 yang sedang terbuka di browser, pastikan URL bar terlihat dan mengarah ke IP `20.24.181.196`)*

---

## 6. Pengujian Disaster Recovery (Failover Test)

Untuk membuktikan secara empiris bahwa mekanisme *High Availability* berfungsi, pengujian simulasi kerusakan server (*Chaos Engineering*) dijalankan.

### Skenario *Downtime* Sengaja:
1. Kondisi awal: Load Balancer membagi trafik normal ke VM-01 dan VM-02.
2. Eksekusi: Layanan Nginx di VM-01 dimatikan secara paksa via instruksi tingkat kernel (`sudo systemctl stop nginx`).
3. Deteksi: Dalam waktu maksimal 10 detik, *Health Probe* Azure LB mendeteksi kode respon non-200 dari VM-01.
4. Mitigasi: Azure LB secara algoritmik menghapus VM-01 dari *rotation pool* dan melempar **100% rute trafik klien ke VM-02**.
5. Validasi: Ketika *client browser* memuat ulang halaman (*refresh*), aplikasi **tetap memuat seketika tanpa putus (Zero Downtime)**.
6. Restorasi: Ketika Nginx VM-01 dihidupkan kembali, LB otomatis memasukkannya kembali ke dalam rotasi.

> **[SECTION SCREENSHOT]**
> *(Masukkan screenshot dari halaman Metrics Azure Load Balancer (Insights), yang menunjukkan grafik "Health Probe Status" di mana salah satu garis tetap di atas (100) saat yang lain turun sesaat)*
