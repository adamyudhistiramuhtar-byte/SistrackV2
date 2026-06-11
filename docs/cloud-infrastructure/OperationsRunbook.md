# Operations Runbook — SistrackV2 Enterprise Production Environment

> **Prosedur standar operasional untuk tim yang mengelola infrastruktur SistrackV2 di Azure.**

---

## Table of Contents

- [1. Deployment Checklist](#1-deployment-checklist)
- [2. Maintenance Checklist](#2-maintenance-checklist)
- [3. Monitoring Checklist](#3-monitoring-checklist)
- [4. Incident Response Checklist](#4-incident-response-checklist)
- [5. Scaling Procedures](#5-scaling-procedures)
- [6. Rollback Procedures](#6-rollback-procedures)
- [7. Disaster Recovery Plan](#7-disaster-recovery-plan)
- [8. Routine Operations](#8-routine-operations)

---

## 1. Deployment Checklist

### New Code Deployment (Git Pull Strategy)

Jalankan pada **setiap VM** secara bergantian (rolling deployment):

| # | Step | Command | Verify |
| :---: | :--- | :--- | :--- |
| 1 | SSH ke VM | `ssh -i key.pem azureuser@<IP>` | Prompt muncul |
| 2 | Pull latest code | `cd /var/www/sistrack && git pull` | No errors |
| 3 | Install new deps (jika ada) | `cd backend && for dir in */; do (cd "$dir" && npm install); done` | No errors |
| 4 | Rebuild frontend (jika berubah) | `cd /var/www/sistrack/frontend && npm run build` | Build successful |
| 5 | Run migrations (jika ada) | `cd /var/www/sistrack && npm run db:migrate` | Tables updated |
| 6 | Restart PM2 | `pm2 restart all` | All services online |
| 7 | Verify health | `curl http://localhost/api/health` | `{"status": "ok"}` |
| 8 | Check LB health | Azure Portal → LB → Backend pools | VM shows healthy |

> **Rolling Deployment**: Deploy ke VM-02 terlebih dahulu. Setelah verified healthy, deploy ke VM-01. Ini memastikan minimal satu VM selalu melayani trafik.

---

## 2. Maintenance Checklist

### Weekly Maintenance

| # | Task | Command | Notes |
| :---: | :--- | :--- | :--- |
| 1 | Update OS packages | `sudo apt update && sudo apt upgrade -y` | Run on each VM |
| 2 | Check disk usage | `df -h` | Alert if > 80% |
| 3 | Review PM2 logs | `pm2 logs --lines 100` | Look for errors |
| 4 | Check Nginx error log | `sudo tail -100 /var/log/nginx/error.log` | Note any 502/504 |
| 5 | Verify database backup | Azure Portal → MySQL → Backup | Last backup < 24h ago |
| 6 | Check SSL expiry | `sudo certbot certificates` | Renew if < 14 days |
| 7 | Review Azure costs | Azure Portal → Cost Management | Stay within budget |

### Monthly Maintenance

| # | Task | Command/Action | Notes |
| :---: | :--- | :--- | :--- |
| 1 | Rotate PM2 logs | `pm2 flush` | Prevents disk fill |
| 2 | Rotate Nginx logs | `sudo logrotate /etc/logrotate.d/nginx` | Usually auto |
| 3 | Review NSG rules | Azure Portal → NSG | Remove unused rules |
| 4 | Update Node.js | `nvm install 20 --reinstall-packages-from=current` | Keep LTS |
| 5 | Review Azure Advisor | Azure Portal → Advisor | Apply recommendations |

---

## 3. Monitoring Checklist

### Daily Health Verification

| # | Check | Method | Healthy |
| :---: | :--- | :--- | :--- |
| 1 | Website accessible | Browser → `http://<LB-IP>` | UI loads |
| 2 | LB health probe | Azure Portal → LB → Metrics | 100% both VMs |
| 3 | PM2 all online | SSH → `pm2 status` (each VM) | 6 services online |
| 4 | API responding | `curl http://<LB-IP>/api/products/available` | JSON response |
| 5 | Database connected | Check PM2 logs for DB errors | No connection errors |
| 6 | Azure credit remaining | Azure Portal → Subscriptions → Usage | > $10 remaining |

### Azure Monitor Alerts (Recommended Setup)

| Alert Name | Metric | Condition | Severity |
| :--- | :--- | :--- | :--- |
| `LB-Unhealthy-VM` | Health Probe Status | < 100% for 5 min | Critical |
| `VM-High-CPU` | CPU Percentage | > 90% for 10 min | Warning |
| `VM-Low-Memory` | Available Memory | < 100 MB for 5 min | Critical |
| `DB-Storage-Full` | Storage Percent | > 85% | Warning |
| `LB-No-Traffic` | Packet Count | = 0 for 30 min | Info |

---

## 4. Incident Response Checklist

### Severity Levels

| Level | Description | Response Time | Example |
| :--- | :--- | :--- | :--- |
| **P1 - Critical** | Service completely down | Immediate (< 15 min) | Both VMs unhealthy |
| **P2 - High** | Degraded performance | < 1 hour | One VM unhealthy |
| **P3 - Medium** | Minor feature broken | < 4 hours | Analytics not loading |
| **P4 - Low** | Cosmetic issue | Next business day | UI alignment issue |

### P1 Response Procedure

```
1. ASSESS
   □ Check Azure Portal → LB → Backend Pool health
   □ SSH to each VM → pm2 status
   □ Check Nginx: sudo systemctl status nginx
   □ Check database: mysql -h <host> -u <user> -p -e "SELECT 1"

2. TRIAGE
   □ If Nginx down → sudo systemctl restart nginx
   □ If PM2 down → cd /var/www/sistrack && pm2 restart all
   □ If DB unreachable → Check Azure MySQL status in Portal
   □ If NSG issue → Verify rules haven't been modified

3. RECOVER
   □ Verify health probe returns healthy
   □ Test website from browser
   □ Test API endpoint
   □ Monitor for 15 minutes

4. DOCUMENT
   □ Record incident timeline
   □ Record root cause
   □ Record resolution steps
   □ File incident report
```

---

## 5. Scaling Procedures

### Add New VM to Backend Pool

**Estimated Time**: 45 minutes

| # | Step | Duration |
| :---: | :--- | :--- |
| 1 | Create VM in Availability Set | 5 min |
| 2 | Install software stack | 10 min |
| 3 | Clone repository & install deps | 10 min |
| 4 | Copy .env and Nginx config | 5 min |
| 5 | Start PM2 services | 2 min |
| 6 | Verify local health | 3 min |
| 7 | Add NIC to LB backend pool | 2 min |
| 8 | Verify health probe detects new VM | 3 min |
| 9 | Validation testing | 5 min |

### Remove VM from Backend Pool

**Untuk maintenance atau decommissioning:**

```bash
# 1. Remove NIC from backend pool (traffic stops going to this VM)
az network nic ip-config address-pool remove \
  --resource-group Sistrack-RG \
  --nic-name <VM-NIC-NAME> \
  --ip-config-name ipconfig1 \
  --lb-name sistrack-lb \
  --address-pool sistrack-backend-pool

# 2. Wait 30 seconds for in-flight requests to complete
sleep 30

# 3. Now safe to perform maintenance on this VM
```

---

## 6. Rollback Procedures

### Code Rollback

```bash
# On each VM:
cd /var/www/sistrack

# See recent commits
git log --oneline -10

# Rollback to specific commit
git checkout <COMMIT_HASH>

# Rebuild frontend if needed
cd frontend && npm run build && cd ..

# Restart services
pm2 restart all
```

### Full Infrastructure Rollback (Back to Single VM)

```bash
# 1. Assign Public IP directly to VM-01
az network nic ip-config update \
  --resource-group Sistrack-RG \
  --nic-name sistrack-web-vmVMNic \
  --name ipconfig1 \
  --public-ip-address sistrack-web-vm-pip

# 2. Remove LB backend pool members
az network nic ip-config address-pool remove \
  --resource-group Sistrack-RG \
  --nic-name sistrack-web-vmVMNic \
  --ip-config-name ipconfig1 \
  --lb-name sistrack-lb \
  --address-pool sistrack-backend-pool

# 3. Update DNS if applicable
# 4. Delete LB resources (optional):
az network lb delete --resource-group Sistrack-RG --name sistrack-lb
az network public-ip delete --resource-group Sistrack-RG --name sistrack-lb-pip
```

---

## 7. Disaster Recovery Plan

### Recovery Time Objectives

| Scenario | RTO (Target) | RPO (Data Loss) | Recovery Method |
| :--- | :--- | :--- | :--- |
| Single VM failure | 10 seconds | 0 (auto-failover) | LB removes unhealthy VM |
| Both VMs failure | 15-30 minutes | 0 | Restart VMs + PM2 |
| Database corruption | 30-60 minutes | < 5 minutes | Azure Point-in-Time Restore |
| Complete region failure | 2-4 hours | < 1 hour | Redeploy in new region |
| Accidental code deletion | 5 minutes | 0 | Git clone from GitHub |

### Emergency Recovery Steps

```bash
# SCENARIO: Both VMs unresponsive

# Step 1: Restart VMs from Azure Portal or CLI
az vm restart --resource-group Sistrack-RG --name sistrack-web-vm
az vm restart --resource-group Sistrack-RG --name sistrack-web-vm2

# Step 2: Wait for VMs to boot (~2 minutes)

# Step 3: If PM2 auto-start configured, services should resume
# If not, SSH to each VM:
cd /var/www/sistrack && pm2 start ecosystem.config.js && pm2 save

# Step 4: Verify LB health probes detect healthy VMs
# Azure Portal → sistrack-lb → Metrics → Health Probe Status
```

---

## 8. Routine Operations

### Application Code Update (Standard Procedure)

```bash
# Rolling update: VM-02 first, then VM-01

# --- VM-02 ---
ssh -J azureuser@<VM-01-IP> azureuser@10.0.1.5
cd /var/www/sistrack
git pull
cd frontend && npm run build && cd ..
cd backend && for dir in */; do (cd "$dir" && npm install); done && cd ..
pm2 restart all
curl http://localhost  # verify
exit

# Wait 30 seconds, verify VM-02 healthy in LB

# --- VM-01 ---
ssh -i sistrack-ssh-key.pem azureuser@<VM-01-IP>
cd /var/www/sistrack
git pull
cd frontend && npm run build && cd ..
cd backend && for dir in */; do (cd "$dir" && npm install); done && cd ..
pm2 restart all
curl http://localhost  # verify
exit

# Verify both VMs healthy in Azure Portal
```

### Quick Reference Commands

| Operation | Command |
| :--- | :--- |
| View all PM2 processes | `pm2 status` |
| View real-time logs | `pm2 logs` |
| Restart all services | `pm2 restart all` |
| Check Nginx config | `sudo nginx -t` |
| Restart Nginx | `sudo systemctl restart nginx` |
| Check disk space | `df -h` |
| Check memory | `free -m` |
| Check CPU | `htop` |
| Check LB IP | `az network public-ip show -g Sistrack-RG -n sistrack-lb-pip --query ipAddress -o tsv` |

---

<div align="center">
  <b>SisTrackV2 Enterprise</b> &copy; 2026 Adam Yudhistira Muhtar. All Rights Reserved.<br>
  <i>Confidential & Proprietary Operations Runbook.</i>
</div>
