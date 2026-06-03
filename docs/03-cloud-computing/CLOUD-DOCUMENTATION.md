# LAYER 3 — DOKUMENTASI CLOUD COMPUTING (AZURE FOR STUDENTS)

Selamat datang di Dokumentasi Infrastruktur Cloud untuk **SistrackV2**. Arsitektur ini dirancang secara khusus agar *cost-effective* dengan mengoptimalkan akses gratis *(free tier)* yang disediakan oleh program **Microsoft Azure for Students**.

Dokumen ini dipecah ke dalam beberapa sub-bagian spesifik untuk kemudahan navigasi:

1. [Arsitektur Cloud](./01-architecture/ARCHITECTURE.md)
   Rancangan topologi jaringan, pemilihan *region*, daftar layanan Azure yang digunakan, dan estimasi biaya operasional.

2. Konfigurasi Layanan Cloud
   Panduan *setup* mendetail lapis demi lapis:
   - [Konfigurasi Web Server (VM)](./02-configuration/web-server-config.md)
   - [Konfigurasi Database Server](./02-configuration/database-server-config.md)
   - [Konfigurasi Load Balancer](./02-configuration/load-balancer-config.md)

3. [Proses Deployment (SOP)](./03-deployment/DEPLOYMENT.md)
   Prosedur operasional standar (SOP) dari tahap persiapan kode, rilis ke *production*, hingga mekanisme *rollback* saat terjadi kegagalan sistem.

4. [Evidence & Pembuktian](./04-evidence/EVIDENCE.md)
   Kumpulan *screenshot* dan bukti nyata bahwa aplikasi, HTTPS, *Load Balancer*, dan *Database* beroperasi dan dapat diakses dengan sukses oleh publik secara aman.
