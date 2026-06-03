# BUKTI APLIKASI BERHASIL DIAKSES ONLINE (EVIDENCE)

Bagian ini digunakan sebagai laporan hasil akhir (bukti fisik) kepada *Stakeholders* atau Dosen Penguji bahwa aplikasi **SistrackV2** sungguh-sungguh telah berjalan di lingkungan Cloud *production-ready*.

*(Catatan: Semua area placeholder screenshot `![Screenshot](...)` dapat diganti dengan tangkapan layar sesungguhnya saat implementasi tugas ini dirilis.)*

── INFORMASI AKSES (WAJIB DISERTAKAN) ────────

| Informasi          | Value                          |
|--------------------|--------------------------------|
| URL Aplikasi       | https://sistrack.domain-anda.com|
| IP Public          | 20.xx.xx.xx (Azure VM IP)      |
| Cloud Provider     | Microsoft Azure (for Students) |
| Region             | Southeast Asia (Singapore)     |
| Environment        | Production                     |
| Tanggal Deploy     | 03/06/2026                     |
| Versi Aplikasi     | v1.0.0                         |

---

### Bukti 1: URL Aplikasi Aktif
**Tanggal/Waktu**: 03/06/2026 14:00 WIB
**Keterangan**: Halaman utama (Seat Select) terbuka dengan sempurna di Chrome browser, menunjukkan *Vue app* telah dilayani oleh Nginx/VM secara online.
![Screenshot URL Aktif](./screenshots/bukti-1-url-active.png)

### Bukti 2: HTTPS Certificate Valid
**Tanggal/Waktu**: 03/06/2026 14:05 WIB
**Keterangan**: Detail gembok hijau (*Padlock*) pada *address bar* menunjukkan sertifikat *Let's Encrypt* mengamankan lalu lintas data (TLS).
![Screenshot SSL Valid](./screenshots/bukti-2-https.png)

### Bukti 3: Load Balancer Aktif
**Tanggal/Waktu**: 03/06/2026 14:10 WIB
**Keterangan**: Dasbor Azure Portal menunjukkan *Application Gateway* berjalan sehat dengan status *Backend Pool (Healthy)*.
![Screenshot Azure Load Balancer](./screenshots/bukti-3-loadbalancer.png)

### Bukti 4: Web Server Running
**Tanggal/Waktu**: 03/06/2026 14:12 WIB
**Keterangan**: Koneksi SSH aktif di latar belakang menampilkan output `pm2 status` yang memperlihatkan *Gateway* dan *Service* lainnya dengan warna hijau (status `online`).
![Screenshot PM2 Status](./screenshots/bukti-4-pm2.png)

### Bukti 5: Database Terhubung
**Tanggal/Waktu**: 03/06/2026 14:15 WIB
**Keterangan**: Eksekusi antarmuka GUI (Dasbor Admin) yang mengambil data list menu (*Products*) secara dinamis. Bukti ini menandakan konektivitas internal antara Node.js di VM dan instans *Azure Database for MySQL* berjalan dengan sempurna.
![Screenshot Database Response](./screenshots/bukti-5-db-query.png)

### Bukti 6: Performance Test (Apache Bench)
**Tanggal/Waktu**: 03/06/2026 14:30 WIB
**Keterangan**: Tes beban menggunakan *tool* `ab` (`ab -n 100 -c 10 https://sistrack.domain-anda.com/api/products/available`). Memperlihatkan bahwa rata-rata *latency* (waktu respon) sangat cepat dan bebas *error rate*.
![Screenshot Kinerja AB](./screenshots/bukti-6-performance.png)

### Bukti 7: Cloud Dashboard Overview
**Tanggal/Waktu**: 03/06/2026 14:40 WIB
**Keterangan**: Gambaran umum di dalam Azure Portal dari Resource Group `SistrackV2-RG` yang mengelompokkan Virtual Network, VM, Public IP, NSG, dan Azure MySQL dalam satu panel.
![Screenshot Azure Resource Group](./screenshots/bukti-7-rg-dashboard.png)
