# PANDUAN EKSEKUSI TUGAS BESAR CLOUD COMPUTING (LENGKAP DARI 0 HINGGA DEPLOYMENT)

Panduan ini adalah *Standard Operating Procedure* (SOP) komprehensif yang dirancang untuk membimbing Anda dari **Titik Nol (0)** (belum memiliki apa-apa selain source code) hingga aplikasi SistrackV2 mengudara (*live*) di internet menggunakan infrastruktur **Azure for Students**.

---

## FASE 0: PERSIAPAN AKUN & ALAT (PRE-REQUISITES)
*Tujuan: Memastikan PC Anda memiliki alat yang dibutuhkan dan akun Cloud yang aktif.*

1. **Buat/Login Akun GitHub**: Pastikan source code proyek SistrackV2 Anda sudah di-*push* ke repositori GitHub Anda (bisa diset *Private* atau *Public*). 
2. **Aktivasi Azure for Students**: Kunjungi `azure.microsoft.com/en-us/free/students/` dan login menggunakan email kampus (berakhiran `.ac.id` atau `.edu`) untuk mendapatkan $100 kredit gratis tanpa kartu kredit.
3. **Instalasi Lokal**: Pastikan komputer/laptop Anda telah terinstal:
   - **Git** (Untuk kloning repository)
   - **Node.js (versi 18+)** 
   - Aplikasi Terminal (Command Prompt, PowerShell, atau Git Bash)

---

## FASE 1: PERSIAPAN REPOSITORY LOKAL
*Tujuan: Memastikan proyek siap untuk di-deploy, terbebas dari file sensitif, dan fitur telah lengkap.*

1. Buka Terminal/VSCode di komputer lokal Anda, arahkan ke folder proyek `SistrackV2`.
2. Pastikan file `.env` (yang berisi *password* lokal) telah dimasukkan ke dalam file `.gitignore` agar tidak bocor ke internet saat di-*push* ke GitHub.
   ```text
   # Isi dari file .gitignore
   node_modules/
   .env
   dist/
   coverage/
   ```
3. Source code Anda saat ini **sudah 100% dilengkapi dengan keamanan (Helmet), Rate Limiting, PM2 ecosystem, Socket.IO, dan sistem Automasi Database (Migration & Seeding)**.
4. Lakukan *Commit* dan *Push* ke GitHub:
   ```bash
   git add .
   git commit -m "Siap deploy ke Cloud: SistrackV2 dengan Microservices"
   git push -u origin main
   ```

---

## FASE 2: MEMBANGUN INFRASTRUKTUR DI CLOUD (AZURE PORTAL)
*Tujuan: Membuat rumah (Database & Server VM) untuk aplikasi Anda di awan.*

### 2.1 Membuat Ruang Kerja (Resource Group & Virtual Network)
1. Login ke **portal.azure.com**.
2. Cari menu **Resource Groups** $\rightarrow$ klik **+ Create**.
   - **Resource group**: `Sistrack-RG`
   - **Region**: `Southeast Asia` (Pilih lokasi terdekat dengan pengguna, misal Singapura).
   - Klik **Review + create** $\rightarrow$ **Create**.
3. Cari menu **Virtual Networks** $\rightarrow$ klik **+ Create**.
   - **Name**: `sistrack-vnet`
   - Masukkan ke Resource Group `Sistrack-RG`.
   - Di tab **IP Addresses**, biarkan *default* IP Space (misal `10.0.0.0/16`).
   - Buat dua subnet: `web-subnet` (`10.0.1.0/24`) dan `db-subnet` (`10.0.2.0/24`). 
   - Klik **Review + create** $\rightarrow$ **Create**.

### 2.2 Membuat Database Terpusat (Azure MySQL Flexible Server)
1. Cari **Azure Database for MySQL flexible servers** di kolom pencarian atas $\rightarrow$ klik **+ Create**.
2. Konfigurasi Dasar:
   - **Resource Group**: Pilih `Sistrack-RG`.
   - **Server name**: `sistrack-mysql-prod` *(Nama harus unik sedunia, tambahkan angka jika bentrok)*.
   - **Region**: `Southeast Asia`.
   - **Workload type**: Pilih **Development** (agar masuk kategori murah/gratis).
   - **Compute + storage**: Klik *Configure server*, pilih **Burstable B1ms** (1 vCore, 2 GiB memory).
   - **Authentication**: Pilih **MySQL authentication only**.
   - **Admin username**: `sistrack_admin`
   - **Password**: `P@ssw0rdSuperKuat123!`
3. Konfigurasi Jaringan (Networking):
   - **Connectivity method**: Pilih **Private access (VNet Integration)** *(Penting untuk keamanan agar DB tak bisa ditembus dari luar)*.
   - **Virtual network**: Pilih `sistrack-vnet`.
   - **Subnet**: Pilih `db-subnet`.
4. Klik **Review + create** $\rightarrow$ **Create**. *(Tunggu 5-10 menit hingga statusnya 'Deployment Succeeded')*.

### 2.3 Membuat Komputer Server (Ubuntu Virtual Machine)
1. Cari menu **Virtual Machines** $\rightarrow$ klik **+ Create** $\rightarrow$ **Azure Virtual Machine**.
2. Konfigurasi Dasar:
   - **Virtual machine name**: `sistrack-web-vm`
   - **Region**: `Southeast Asia`
   - **Image**: Pilih **Ubuntu Server 22.04 LTS - x64 Gen2**
   - **Size**: Pilih **Standard_B1s** *(1 vcpu, 1 GiB memory - Terdapat logo 'Free services eligible')*.
   - **Authentication type**: Pilih **SSH public key**
   - **Username**: `ubuntu`
   - **Key pair name**: `sistrack-ssh-key`
3. Konfigurasi Jaringan & Port (Penting!):
   - **Virtual network**: Pilih `sistrack-vnet`
   - **Subnet**: Pilih `web-subnet`
   - **Public IP**: Biarkan membuat baru secara otomatis.
   - Di bagian **Public inbound ports**, centang:
     - `HTTP (80)` (Untuk web browser biasa)
     - `HTTPS (443)` (Untuk koneksi aman/SSL)
     - `SSH (22)` (Untuk me-remote server dari laptop Anda)
4. Klik **Review + create** $\rightarrow$ **Create**.
5. **SANGAT PENTING:** Layar akan memunculkan *pop-up* **"Download private key and create resource"**. Klik tombol itu. Sebuah file bernama `sistrack-ssh-key.pem` akan terunduh ke laptop Anda. Simpan baik-baik file ini.

---

## FASE 3: MENGAKSES DAN MENGATUR SERVER (SSH COMMANDS)
*Tujuan: Masuk ke dalam VM dan menginstal software yang dibutuhkan seperti Nginx, Node.js, dan PM2.*

### 3.1 Remote Login ke Virtual Machine
1. Lihat **IP Public VM** Anda di halaman Overview VM di Azure Portal (contoh: `20.123.45.67`).
2. Buka terminal di komputer Anda, navigasikan (*cd*) ke folder tempat file `.pem` Anda terunduh.
3. Ubah izin file `.pem` (Khusus pengguna Mac/Linux):
   ```bash
   chmod 400 sistrack-ssh-key.pem
   ```
4. Hubungkan komputer Anda ke VM menggunakan perintah SSH:
   ```bash
   ssh -i sistrack-ssh-key.pem ubuntu@20.123.45.67
   ```
   *(Ketik `yes` jika ditanya mengenai autentikasi fingerprint server).*

### 3.2 Instalasi Software Stack di Server Ubuntu
Setelah Anda masuk ke VM (ditandai dengan `ubuntu@sistrack-web-vm:~$`), ketik perintah berikut baris demi baris:
```bash
# 1. Update daftar paket OS Ubuntu
sudo apt update && sudo apt upgrade -y

# 2. Instal Web Server (Nginx), Git, dan MySQL Client
sudo apt install nginx git mysql-client -y

# 3. Instal Node.js versi 20 menggunakan NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
node -v   # Pastikan outputnya menampilkan v20.x.x

# 4. Instal PM2 (Process Manager) secara global agar microservices tetap hidup di background
npm install -g pm2
```

---

## FASE 4: DEPLOYMENT KODE DAN DATABASE
*Tujuan: Memindahkan kode dari GitHub ke server, mengatur password database, dan menyalakan aplikasi.*

### 4.1 Download Kode Aplikasi (Kloning)
```bash
# Buat folder aplikasi di root server
sudo mkdir -p /var/www/sistrack
sudo chown -R ubuntu:ubuntu /var/www/sistrack

# Pindah ke folder tersebut dan download dari GitHub
cd /var/www/sistrack
# (Ganti URL di bawah dengan URL repo GitHub Anda sendiri)
git clone https://github.com/[USERNAME-ANDA]/sistrackv2.git .
```

### 4.2 Pembuatan File Rahasia (.env Production)
Kita tidak mengupload file `.env` ke Github, sehingga kita harus membuatnya langsung di server.
```bash
nano backend/gateway/.env
```
Copy-paste teks berikut (Ubah `DB_HOST` dengan nama server Azure MySQL Anda, dan `ALLOWED_ORIGINS` dengan IP VM Anda):
```env
PORT=3000
DB_HOST=sistrack-mysql-prod.mysql.database.azure.com
DB_USER=sistrack_admin
DB_PASSWORD=P@ssw0rdSuperKuat123!
DB_NAME=sistrackv2
JWT_SECRET=SangatRahasiaSekali123!_UntukProductionSistrack
AUTH_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004
ANALYTICS_GRPC_URL=localhost:50051

# Ganti ini dengan IP Public VM Anda (Contoh: http://20.123.45.67)
ALLOWED_ORIGINS=http://IP_PUBLIC_VM_ANDA
```
Cara save: Tekan `CTRL + X` $\rightarrow$ Ketik `Y` $\rightarrow$ Tekan `Enter`.

### 4.3 Instalasi Modul NPM dan Build Frontend
```bash
# 1. Install & Build untuk Frontend (Vue.js)
cd /var/www/sistrack/frontend
npm install
npm run build

# 2. Instalasi untuk seluruh Backend (Microservices)
cd /var/www/sistrack
npm install           # Install root package
cd backend
npm install           # Install backend root package
# Perintah cepat menginstal npm di dalam ke-6 sub-folder service
for dir in */; do (cd "$dir" && npm install); done
```

### 4.4 Otomasi Pembuatan Tabel & Data Database (Migrasi & Seeder)
```bash
# 1. Buat Schema / Wadah Database
mysql -h sistrack-mysql-prod.mysql.database.azure.com -u sistrack_admin -p -e "CREATE DATABASE sistrackv2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
# (Masukkan Password: P@ssw0rdSuperKuat123! saat diminta)

# 2. Kembali ke Root Folder Proyek
cd /var/www/sistrack

# 3. Jalankan Script Migrasi (Otomatis membuat 7 Tabel)
npm run db:migrate

# 4. Jalankan Database Seeder (Memasukkan data dummy makanan & kursi)
npm run db:seed
```

### 4.5 Menyalakan Mesin Microservices dengan PM2
```bash
cd /var/www/sistrack

# Perintah ini akan menjalankan 6 service sekaligus (Gateway, Auth, Order, dll) di background
npm run start

# Lihat tabel proses PM2, pastikan semua 6 aplikasi berstatus hijau (online)
pm2 status

# Kunci PM2 agar otomatis hidup kembali saat VM tak sengaja terestart
pm2 startup
# (Copy-paste seluruh output 'sudo env PATH...' yang muncul, lalu tekan Enter)
pm2 save
```

---

## FASE 5: KONFIGURASI NGINX REVERSE PROXY
*Tujuan: Menjadikan Nginx sebagai penjaga pintu depan. Semua orang yang mengetikkan IP VM di browser (Port 80) akan diarahkan ke Frontend Vue atau Gateway Backend secara otomatis.*

1. Buat file konfigurasi web:
   ```bash
   sudo nano /etc/nginx/sites-available/sistrack
   ```
2. *Copy-paste* kode ini:
   ```nginx
   server {
       listen 80;
       server_name _; # Menandakan akan menerima semua IP/Domain

       # 1. Mengarahkan URL biasa ke folder Frontend Vue
       location / {
           root /var/www/sistrack/frontend/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # 2. Mengarahkan URL yang berawalan /api/ ke Backend API Gateway
       location /api/ {
           proxy_pass http://localhost:3000/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           
           # Meneruskan IP Asli pelanggan (Penting untuk keamanan Rate Limiter)
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
   Tekan `CTRL + X` $\rightarrow$ `Y` $\rightarrow$ `Enter`.
3. Aktifkan konfigurasi:
   ```bash
   # Hapus halaman "Welcome to Nginx" bawaan
   sudo rm /etc/nginx/sites-enabled/default
   
   # Aktifkan konfigurasi kita dengan cara symlink
   sudo ln -s /etc/nginx/sites-available/sistrack /etc/nginx/sites-enabled/
   
   # Cek apakah ada typo di konfigurasi
   sudo nginx -t
   
   # Restart Nginx
   sudo systemctl restart nginx
   ```
4. **UJIAN FINAL**: Buka browser di laptop Anda, masukkan IP Public VM (misal: `http://20.123.45.67`). Anda seharusnya sudah bisa melihat halaman pemesanan makanan SisTrackV2!

---

## FASE 6 (OPSIONAL TAPI NILAI PLUS): SSL DAN NAMA DOMAIN
*Tujuan: Mengubah URL IP menjadi nama website resmi (misal: `sistrack.my.id`) dan mendapatkan Logo Gembok Hijau (HTTPS).*

1. Beli atau daftarkan domain gratis.
2. Di panel DNS domain Anda, arahkan **A Record** ke **IP Public VM Azure**.
3. Di dalam terminal SSH VM, instal sertifikat SSL Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   
   # Ganti dengan nama domain Anda
   sudo certbot --nginx -d sistrack.domainanda.com
   ```
   *(Pilih opsi angka '2' untuk Redirect saat ditanya, agar HTTP otomatis melompat ke HTTPS yang aman).*

---

## FASE 7: PEMBUATAN LAPORAN BUKTI (EVIDENCE TUGAS BESAR)
Gunakan alat tangkapan layar (Snipping Tool) di PC Anda untuk mendokumentasikan kelancaran sistem ini di dalam laporan Anda:

1. **Bukti Infrastruktur Cloud Terbentuk**: 
   - Tangkapan layar dari portal Azure yang memperlihatkan **sistrack-web-vm** berjalan (Status: *Running*).
   - Tangkapan layar portal Azure untuk **sistrack-mysql-prod** (Status: *Available*).
2. **Bukti Backend Node.js Menyala Stabil**:
   - Di terminal SSH Anda, ketik `pm2 status`. Tangkapan layar tabel tersebut yang menampilkan 6 proses berwarna hijau *online*.
3. **Bukti Aplikasi Dapat Diakses Publik**:
   - Tangkapan layar *Browser* Anda (misal Google Chrome) sedang menampilkan UI halaman menu makanan. Pastikan *Address Bar* browser memperlihatkan IP VM atau Domain Anda, BUKAN tulisan `localhost`.
4. **Bukti Real-time Pemesanan Berfungsi**:
   - Lakukan order dari HP/Browser 1, lalu buka Dasbor Admin di Browser 2. Tangkapan layar saat order muncul secara otomatis (mengkonfirmasi Socket.IO aktif di Cloud).

---
**🏆 PENUTUP**
Selamat! Anda baru saja mempraktekkan *Full Cycle Cloud Deployment* setara industri. Mulai dari konfigurasi Jaringan (VNet), pembuatan Database PaaS, Manajemen VM Linux, Automasi Process (PM2), Migrasi Otomatis, dan Load Balancing/Reverse Proxy Nginx. Aplikasi **SistrackV2** telah tuntas secara paripurna.
