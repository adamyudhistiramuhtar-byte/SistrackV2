# KONFIGURASI WEB SERVER (AZURE VIRTUAL MACHINE)

## A. Spesifikasi Instance / VM
- **Operating System**: Ubuntu 22.04 LTS (Jammy Jellyfish)
- **Ukuran (Size)**: Standard B1s
- **Spesifikasi**: 1 vCPU | 1 GB RAM | 30 GB Standard SSD
- **Network**: Tergabung dalam `sistrack-vnet`, subnet `web-subnet`.
- **Network Security Group (NSG) Rules**:
  - Inbound Port 22 (SSH) - Hanya dari IP Administrator.
  - Inbound Port 80 (HTTP) - Dari internet (atau *Load Balancer*).
  - Inbound Port 443 (HTTPS) - Dari internet.

## B. Software Stack Installation

Koneksikan SSH ke instance, lalu jalankan perintah berikut:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Instal Node.js (via NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 18

# Instal Nginx
sudo apt install nginx -y
```

Konfigurasi Reverse Proxy Nginx untuk menghubungkan port 80 dengan API Gateway lokal di port 3000.

```bash
# /etc/nginx/sites-available/sistrack.conf
server {
    listen 80;
    server_name sistrack.domain.com;
    
    # Rute ke Frontend statik (dist folder Vue 3)
    location / {
        root /var/www/sistrack/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy ke API Gateway
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*Tautkan ke sites-enabled dan restart nginx:*
`sudo ln -s /etc/nginx/sites-available/sistrack.conf /etc/nginx/sites-enabled/`
`sudo systemctl restart nginx`

## C. SSL/TLS Certificate (WAJIB)

Menggunakan **Let's Encrypt / Certbot**.

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d sistrack.domain.com
```

*Certbot akan secara otomatis memperbarui file Nginx dan memaksakan redirection dari HTTP ke HTTPS.*

## D. Environment Variable Setup

Jangan menyimpan file kredensial produksi dalam repository Git.
Buat file `.env` di dalam folder *backend* produksi di server.

```bash
sudo nano /var/www/sistrack/backend/gateway/.env
```
Isi file:
```env
PORT=3000
DB_HOST=sistrack-db-server.mysql.database.azure.com
DB_USER=admin_sistrack
DB_PASSWORD=SecretPassword123!
DB_NAME=sistrackv2
JWT_SECRET=super_secret_jwt_token_key_production
AUTH_SERVICE_URL=http://localhost:3001
# dst...
```

## E. Process Manager (PM2)

Memastikan semua *microservice* Node.js akan restart otomatis setelah server *reboot* atau jika terjadi *crash*.

```bash
# Instal PM2 global
npm install -g pm2

# Mulai gateway & service (Asumsikan di-script dalam file run.production.sh atau ecosystem.config.js)
pm2 start ecosystem.config.js --env production

# Jadikan PM2 berjalan saat boot
pm2 startup systemd
# Jalankan perintah yang dihasilkan oleh "pm2 startup", kemudian:
pm2 save

# Output status
pm2 status
```
