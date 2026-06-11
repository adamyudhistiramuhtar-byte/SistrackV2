# Troubleshooting Guide — SistrackV2 Enterprise Azure Infrastructure

> **Panduan pemecahan masalah komprehensif untuk operasional harian.**

---

## Table of Contents

- [1. Azure Load Balancer Issues](#1-azure-load-balancer-issues)
- [2. Nginx Issues](#2-nginx-issues)
- [3. PM2 / Application Issues](#3-pm2--application-issues)
- [4. Database Issues](#4-database-issues)
- [5. SSL/TLS Issues](#5-ssltls-issues)
- [6. DNS Issues](#6-dns-issues)
- [7. Network / NSG Issues](#7-network--nsg-issues)
- [8. Debugging Procedures](#8-debugging-procedures)

---

## 1. Azure Load Balancer Issues

### VMs Showing "Unhealthy" in Backend Pool

| Symptom | Possible Cause | Solution |
| :--- | :--- | :--- |
| Both VMs unhealthy | NSG blocking health probe | Add NSG rule: Source = `AzureLoadBalancer`, Allow All |
| Both VMs unhealthy | Nginx not running on VMs | SSH to VM → `sudo systemctl start nginx` |
| One VM unhealthy | PM2 crashed on that VM | SSH to VM → `pm2 restart all` |
| Intermittent unhealthy | VM CPU/memory exhausted | Check `htop`, consider upgrading VM size |

**Diagnostic Command:**
```bash
# Check if Nginx is responding locally on the VM
curl -I http://localhost
# Expected: HTTP/1.1 200 OK
```

### Website Not Loading via LB IP

```bash
# 1. Verify LB Public IP
az network public-ip show --resource-group Sistrack-RG --name sistrack-lb-pip --query ipAddress -o tsv

# 2. Verify LB has rules
az network lb rule list --resource-group Sistrack-RG --lb-name sistrack-lb -o table

# 3. Verify backend pool members
az network lb address-pool show --resource-group Sistrack-RG --lb-name sistrack-lb --name sistrack-backend-pool -o table

# 4. Check health probe status via Azure Portal
# Portal → sistrack-lb → Metrics → "Health Probe Status"
```

### Traffic Not Distributed Evenly

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| All traffic goes to VM-01 | VM-02 failing health probe | Check VM-02 Nginx + PM2 status |
| Sessions stick to one VM | Session persistence enabled | Set LB rule session persistence to "None" |
| Uneven under low traffic | Normal with 5-tuple hash | Under low request volume, distribution can appear skewed; this is expected |

---

## 2. Nginx Issues

### Common Nginx Errors

| Error | Cause | Solution |
| :--- | :--- | :--- |
| `502 Bad Gateway` | Backend PM2 service crashed | `pm2 restart gateway` |
| `504 Gateway Timeout` | Backend taking too long to respond | Check DB connection, increase `proxy_read_timeout` |
| `403 Forbidden` | File permissions wrong on `/frontend/dist` | `sudo chown -R azureuser:azureuser /var/www/sistrack` |
| `404 Not Found` on routes | `try_files` missing in Nginx config | Ensure `try_files $uri $uri/ /index.html;` exists |
| Nginx won't start | Config syntax error | `sudo nginx -t` to see detailed error |

### Nginx Diagnostic Commands
```bash
# Test configuration syntax
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -50 /var/log/nginx/error.log

# View access logs (real-time)
sudo tail -f /var/log/nginx/access.log

# Reload without downtime
sudo nginx -s reload

# Full restart
sudo systemctl restart nginx
```

---

## 3. PM2 / Application Issues

### All Services Showing "errored"

```bash
# 1. Check logs for the specific service
pm2 logs gateway --lines 50

# 2. Common causes:
# - Missing .env file
# - Wrong DB credentials
# - Port already in use

# 3. Fix and restart
pm2 restart all
```

### Gateway CORS Error in Browser

```bash
# Check current ALLOWED_ORIGINS
cat /var/www/sistrack/backend/gateway/.env | grep ALLOWED_ORIGINS

# Must match the LB Public IP or domain
# Example: ALLOWED_ORIGINS=http://20.198.xxx.xxx

# After updating, restart
pm2 restart gateway
```

### Order Creation Fails (500 Error)

```bash
# 1. Check order-service logs
pm2 logs order-service --lines 30

# 2. Common causes:
# - Database connection refused
# - Missing seat in seats table (auto-create should handle this)
# - Invalid session token

# 3. Test DB connection
mysql -h sistrack-mysql-prod.mysql.database.azure.com -u sistrack_admin -p -e "SELECT 1;"
```

### PM2 Not Surviving Reboot

```bash
# 1. Generate startup script
pm2 startup

# 2. Copy the command it outputs (starts with 'sudo env PATH=...')
# and run it

# 3. Save current process list
pm2 save

# 4. Verify
pm2 resurrect  # should restore processes
```

---

## 4. Database Issues

### "Connection Refused" to Azure MySQL

| Check | Command | Expected |
| :--- | :--- | :--- |
| DNS resolution | `nslookup sistrack-mysql-prod.mysql.database.azure.com` | Returns IP in db-subnet range |
| Port connectivity | `nc -zv sistrack-mysql-prod.mysql.database.azure.com 3306` | `Connection succeeded` |
| Credentials | `mysql -h <host> -u sistrack_admin -p` | `mysql>` prompt |
| VNet integration | Azure Portal → MySQL → Networking | Private access via `sistrack-vnet` |

### "Too Many Connections" Error

```bash
# Check current connections
mysql -h <host> -u sistrack_admin -p -e "SHOW STATUS LIKE 'Threads_connected';"

# Azure MySQL B1ms allows max ~50 connections
# If near limit, restart PM2 to release idle connections
pm2 restart all
```

### Database Migration Failed

```bash
# 1. Check migration logs
cd /var/www/sistrack
npm run db:migrate 2>&1

# 2. If table already exists error:
# This is normal, migration is idempotent

# 3. If connection error:
# Verify .env DB_HOST and credentials
```

---

## 5. SSL/TLS Issues

### Certificate Not Found

```bash
# Check if Let's Encrypt certificates exist
sudo ls -la /etc/letsencrypt/live/

# If missing, re-run certbot
sudo certbot --nginx -d yourdomain.com
```

### Certificate Expired

```bash
# Check expiry date
sudo certbot certificates

# Renew
sudo certbot renew

# Verify renewal timer
sudo systemctl status certbot.timer
```

### Mixed Content Warnings

If browser shows mixed content (HTTPS page loading HTTP resources):
1. Ensure Nginx config has proper redirect from HTTP to HTTPS
2. Check `ALLOWED_ORIGINS` uses `https://` prefix
3. Ensure frontend API calls use relative paths (`/api/...` not `http://...`)

---

## 6. DNS Issues

### Domain Not Resolving

```bash
# Check DNS propagation
nslookup yourdomain.com
dig yourdomain.com +short

# Verify A record points to LB Public IP
az network public-ip show --resource-group Sistrack-RG --name sistrack-lb-pip --query ipAddress -o tsv

# DNS propagation can take up to 48 hours (usually < 30 min)
```

---

## 7. Network / NSG Issues

### Cannot SSH to VM

```bash
# 1. Check NSG rules
az network nsg rule list --resource-group Sistrack-RG --nsg-name sistrack-web-nsg -o table

# 2. Ensure SSH (port 22) is allowed from your IP
# 3. If VM has no public IP (VM-02), use jump host:
ssh -J azureuser@<VM-01-IP> azureuser@10.0.1.5
```

### Health Probe Blocked by NSG

```bash
# Azure LB health probes come from IP 168.63.129.16
# Verify NSG allows AzureLoadBalancer service tag
az network nsg rule show \
  --resource-group Sistrack-RG \
  --nsg-name sistrack-web-nsg \
  --name Allow-LB-Probe

# If missing, add it:
az network nsg rule create \
  --resource-group Sistrack-RG \
  --nsg-name sistrack-web-nsg \
  --name Allow-LB-Probe \
  --priority 130 \
  --source-address-prefixes AzureLoadBalancer \
  --destination-port-ranges "*" \
  --access Allow \
  --protocol "*" \
  --direction Inbound
```

---

## 8. Debugging Procedures

### End-to-End Request Tracing

Ketika ada masalah yang tidak jelas, ikuti alur ini dari luar ke dalam:

```
Step 1: Browser/curl → LB Public IP
  └── Gagal? → Cek LB rules, NSG, backend pool health

Step 2: LB → Nginx (Port 80)
  └── Gagal? → SSH ke VM, cek `sudo systemctl status nginx`

Step 3: Nginx → Gateway (localhost:3000)
  └── Gagal? → Cek `pm2 status`, `pm2 logs gateway`

Step 4: Gateway → Microservice (3001-3004/50051)
  └── Gagal? → Cek specific service: `pm2 logs order-service`

Step 5: Microservice → Database
  └── Gagal? → Cek .env credentials, VNet connectivity
```

### Quick Health Check Script

Jalankan script ini di setiap VM untuk diagnosis cepat:

```bash
echo "=== SYSTEM ==="
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p)"
echo "Memory: $(free -m | awk '/Mem:/{printf "%s/%s MB (%.0f%%)", $3, $2, $3/$2*100}')"

echo ""
echo "=== NGINX ==="
sudo systemctl is-active nginx
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost

echo ""
echo "=== PM2 ==="
pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
for p in procs:
    status = '✅' if p['pm2_env']['status'] == 'online' else '❌'
    print(f\"  {status} {p['name']}: {p['pm2_env']['status']}\")
" 2>/dev/null || pm2 status

echo ""
echo "=== DATABASE ==="
mysql -h sistrack-mysql-prod.mysql.database.azure.com -u sistrack_admin -p"P@ssw0rdSuperKuat123!" -e "SELECT 'Connected' AS status;" 2>/dev/null && echo "✅ DB Connected" || echo "❌ DB Connection Failed"

echo ""
echo "=== API HEALTH ==="
curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || echo "❌ Gateway not responding"
```

---

<div align="center">
  <b>SisTrackV2 Enterprise</b> &copy; 2026 Adam Yudhistira Muhtar. All Rights Reserved.<br>
  <i>Confidential & Proprietary Troubleshooting Guide.</i>
</div>
