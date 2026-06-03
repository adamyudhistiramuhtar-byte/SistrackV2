# KONFIGURASI DATABASE SERVER (AZURE DATABASE FOR MYSQL)

## A. Spesifikasi Database Instance
- **Database engine**: MySQL 8.0
- **Managed vs Self-hosted**: **Managed (Azure Database for MySQL - Flexible Server)**.
  *Alasan*: Mengurangi *overhead* konfigurasi, mempermudah skenario pencadangan (*automated backups*), fitur ketersediaan tinggi bawaan (*high availability*), dan patch keamanan sistem operasi sepenuhnya ditangani oleh Microsoft Azure.
- **Ukuran (Size)**: Burstable B1ms (1 vCore, 2 GiB Memory)
- **Storage**: 20 GB Premium SSD (mendukung auto-grow)
- **Backup retention**: 7 hari

## B. Setup Database

Hubungkan diri Anda dari VM Web Server (atau Azure Cloud Shell yang telah diizinkan IP-nya).

```bash
# Koneksi ke database instance
mysql -h sistrack-db-server.mysql.database.azure.com -u admin_sistrack -p
```

Setelah masuk ke *console* MySQL:
```sql
-- Pembuatan skema utama
CREATE DATABASE sistrackv2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Pembuatan user khusus (Jika ingin menghindari root user)
CREATE USER 'app_sistrack'@'%' IDENTIFIED BY 'StrongAppPass!2024';
GRANT ALL PRIVILEGES ON sistrackv2.* TO 'app_sistrack'@'%';
FLUSH PRIVILEGES;
```

Proses impor skema awal:
```bash
mysql -h sistrack-db-server.mysql.database.azure.com -u app_sistrack -p sistrackv2 < ./schema.sql
```

## C. Security Konfigurasi Database
1. **Firewall Rules**: Konfigurasi pada *Azure Portal* secara default memblokir semua alamat IP publik. 
   - Nonaktifkan "Allow public access from any Azure service within Azure to this server".
   - Atur "Virtual Network Rule" (VNet integration) untuk hanya menerima lalu lintas internal dari `web-subnet` tempat VM Node.js berjalan.
   - Hal ini memastikan *Database TIDAK boleh accessible dari internet publik*.
2. **Enkripsi**: Azure secara otomatis mengenkripsi data-at-rest menggunakan *service-managed keys* (Enkripsi AES-256). Koneksi juga diwajibkan menggunakan jalur terenkripsi (`require_secure_transport = ON`).

## D. Connection String
Gunakan URL ini di dalam file `.env` aplikasi Anda (tanpa menyertakan password sebenarnya dalam kode sumber).
```env
# Di dalam aplikasi Express
DATABASE_URL=mysql://app_sistrack:[PASSWORD]@sistrack-db-server.mysql.database.azure.com:3306/sistrackv2?ssl=true
```
