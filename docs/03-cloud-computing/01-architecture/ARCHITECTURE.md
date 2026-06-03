# 3.1 ARSITEKTUR CLOUD (MICROSOFT AZURE)

## Diagram Arsitektur

```text
Internet
   │
   ▼
┌─────────────────────────────────────────────────────────┐
│               MICROSOFT AZURE (Azure for Students)      │
│                                                         │
│  ┌─────────────┐                                        │
│  │ Azure DNS   │                                        │
│  │ (Domain)    │                                        │
│  └──────┬──────┘                                        │
│         │                                               │
│  ┌──────▼──────────────────────────────┐                │
│  │     AZURE APPLICATION GATEWAY       │                │
│  │      (L7 Load Balancer / WAF)       │                │
│  └──────┬────────────┬─────────────────┘                │
│         │            │                                  │
│  ┌──────▼──┐    ┌────▼────┐                             │
│  │VM Web 1 │    │ VM Web 2│ ← VIRTUAL MACHINE SCALE SET │
│  └──────┬──┘    └────┬────┘                             │
│         └──────┬─────┘                                  │
│         ┌──────▼─────────────────┐                      │
│         │ AZURE DATABASE FOR     │                      │
│         │ MYSQL (Flexible Server)│                      │
│         └────────────────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

## Rincian Desain Arsitektur

**Penyedia Layanan (Cloud Provider):** Microsoft Azure
**Alasan Pemilihan:** Menggunakan kredit gratis $100 tahunan dari program *Azure for Students* (gratis VM B1s Linux, Azure SQL/MySQL *free tier*, dan Storage), yang sangat menghemat biaya eksperimen/pengembangan tugas ini tanpa menggunakan kartu kredit pribadi.

**Region yang Dipilih:** Southeast Asia (Singapore)
**Alasan Pemilihan:** Memberikan *latency* (ping) paling rendah untuk target pengguna yang diasumsikan berada di kawasan Indonesia (rata-rata 20-30 ms). Region ini juga mendukung *Availability Zones* penuh dan layanan terkelola tingkat tinggi.

## Daftar Layanan Cloud yang Digunakan

| Layanan Cloud                    | Fungsi                                           | Tier / Size               |
|----------------------------------|--------------------------------------------------|---------------------------|
| Azure Virtual Machines (Linux)   | Web Server - *Hosting* Express.js API & Vue SPA  | Standard B1s (Free Tier)  |
| Azure Database for MySQL         | Database Server - Penyimpanan data persisten     | Burstable B1ms (Flexible) |
| Azure Application Gateway        | Load Balancer - Distribusi *traffic* & SSL term. | Basic / Standard V2       |
| Azure Blob Storage               | Object Storage - Penyimpanan file statik/gambar  | Standard LRS              |
| Azure Virtual Network (VNet)     | Isolasi Jaringan dan Subnetting                  | Free                      |

## Estimasi Biaya Bulanan (Pricing Calculator)

Sebagai akun *Azure for Students*, sebagian layanan di bawah ini gratis (kuota terbatas).
- **VM B1s (Linux) x 2 (jika scale-out)**: ~750 jam gratis per bulan.
- **Azure Database for MySQL**: Fleksibel server *free tier* (12 bulan) hingga batas ukuran.
- **Application Gateway**: Berbayar dari saldo kredit $100. Estimasi ~ $15-$25/bulan.
- **Bandwidth Egress**: 15GB gratis pertama, selebihnya ~ $0.087/GB.
**Total Perkiraan Biaya Asli**: ~$30 - $40 / bulan (Sepenuhnya ditutup oleh kredit edukasi).

## Service Level Agreement (SLA)
- Azure VM dengan *Premium SSD* atau 2+ instance dalam *Availability Set* / *Scale Set*: 99.95% atau 99.99%.
- Azure Database for MySQL Flexible Server: 99.99%.
Jika *downtime* melebihi persentase yang dijanjikan, Azure memberikan kompensasi *Service Credit* sesuai ketentuan.

## Strategi Backup & Disaster Recovery
- **Database**: Diaktifkannya fitur *Automated Backup* dengan retensi 7 hari (bawaan *free tier*).
- **Web Server**: Image (Snapshot) VM dibuat mingguan. VM bersifat *stateless*, sehingga *recovery* cukup dengan menjalankan skrip instalasi pada *instance* baru.
- **Disaster Recovery**: Memanfaatkan replikasi data ke *Geo-Redundant Storage (GRS)* (jika diperlukan pada tingkatan *Enterprise* asli, di luar cakupan kredit *Student*).
