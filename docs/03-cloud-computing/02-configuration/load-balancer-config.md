# KONFIGURASI LOAD BALANCER (AZURE APPLICATION GATEWAY)

## A. Spesifikasi Load Balancer
- **Tipe**: Azure Application Gateway (L7 Load Balancer)
- **Algoritma**: Round Robin (Bawaan)
- **Tier**: Standard_v2 (Mendukung metrik *autoscaling* dan perlindungan DDoS opsional).
- **Health check endpoint**: `/api/health`
- **Health check interval**: 30 detik (Timeout 5 detik).
- **Unhealthy threshold**: 3x percobaan gagal → Server *backend* dihapus sementara dari antrean permintaan.

## B. Target Group / Backend Pool
- **Nama Backend Pool**: `sistrack-backend-pool`
- **Anggota (Targets)**: Mendaftarkan semua Web Server instance (contoh: *Internal IP* `10.0.1.4`, `10.0.1.5` dari VM Scale Set).
- **Port**: 80
- **Protocol**: HTTP (Karena TLS/SSL akan di-terminasi *(SSL Offloading)* di tingkat *Application Gateway*, lalu lintas internal ke *backend* menggunakan HTTP).

## C. Listener Rules
*Application Gateway* dikonfigurasi dengan dua (2) *Listeners*:
- **Listener 1 (HTTP - Port 80)**: Menerima *traffic* non-aman.
  - **Rules**: Memiliki *Routing Rule* bertipe *Redirect* menuju HTTPS (Port 443).
- **Listener 2 (HTTPS - Port 443)**: Memiliki sertifikat SSL terpasang (Diimpor dari Azure Key Vault atau Let's Encrypt *.pfx*).
  - **Rules**: Memiliki *Routing Rule* menuju `sistrack-backend-pool`.

## D. Sticky Sessions (Session Affinity)
- **Status**: Diaktifkan (Cookie-based Affinity).
- Karena *SistrackV2* memiliki komponen *Socket.IO* (di dalam `notification-service`) yang membutuhkan koneksi berkelanjutan dari *client* ke *server* yang sama (khususnya jika *polling* mendahului *WebSocket* upgrade).
- **Duration**: Berdasarkan sesi *browser* (menghilang saat browser ditutup).

## E. Auto Scaling (Azure VM Scale Sets)
Meskipun akun pelajar memiliki keterbatasan kuota komputasi tinggi, secara teoretis skalabilitas otomatis diatur sebagai berikut di tingkat *VM Scale Set*:
- **Min instances**: 1
- **Max instances**: 2 (Batas kuota vCPU gratis).
- **Scale-out trigger**: Rata-rata Utilisasi CPU > 70% selama durasi agregasi 5 menit.
- **Scale-in trigger**: Rata-rata Utilisasi CPU < 30% selama durasi agregasi 10 menit.
