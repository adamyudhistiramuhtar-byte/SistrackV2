# [LAYER 2] SistrackV2 Enterprise: Improvement Project & Scale Blueprint

> **Document Version**: 3.0  
> **Last Updated**: June 2026  
> **Classification**: Confidential — Academic Final Project Deliverable  
> **Author**: Adam Yudhistira Muhtar  

## 1. Executive Summary
Berdasarkan tinjauan arsitektur (Layer 1), peladen telah sukses bermigrasi pada kluster **Microservices**. Namun, agar perangkat lunak berevolusi dari *Corporate* menuju *Massive-Scale Enterprise*, dibutuhkan peta jalan perbaikan teknis (*Improvement Project*). Dokumen ini menguraikan resolusi strategis guna mengeliminasi hambatan komputasional (*bottlenecks*) dan meroketkan skalabilitas komputasi SistrackV2.

---

## 2. Identifikasi Hambatan Teknis (Bottleneck Diagnoses)

1. **Shared Database Anti-Pattern**
   - Saat ini, seluruh komponen (*Auth*, *Product*, *Order*) menembak lalu lintas ke satu Pangkalan Data tunggal (`sistrackv2`). 
   - *Risiko*: Walaupun mencegah kompleksitas data, jika beban I/O basis data memuncak, ini menciptakan *Single Point of Failure (SPOF)* pada lapis data.
2. **Latensi Pengambilan Data (Read-Heavy Operations)**
   - API katalog produk dieksekusi ratusan kali per menit tanpa lapisan *Cache*. Pada jam kritis (Peak Hours), kueri tanpa henti ke MySQL memboroskan sumber daya *Compute*.
3. **Komunikasi Antar Service yang Synchronous (REST/Axios)**
   - Proses pembentukan pesanan saat ini menggunakan HTTP REST yang bersifat *blocking*. Jika satu layanan melambat, latensi klien akan berlipat ganda.

---

## 3. Resolusi Strategis Tingkat Lanjut (Proposed Improvements)

### 3.1 Peningkatan Arsitektur Data Berkinerja Tinggi
- **Database Isolation per Service**
  - Isolasi logikal skema MySQL:
    - `sistrackv2_auth` (Otorisasi).
    - `sistrackv2_product` (Manajemen Inventaris).
    - `sistrackv2_order` (Manajemen Transaksi).
  - Validasi Lintas-Domain akan dijembatani via protokol ultra-cepat *gRPC*, menghilangkan *Join Query* yang memberatkan basis data.
- **Implementasi Caching Layer (In-Memory Redis)**
  - Pengenalan kluster Redis di dalam lapisan `product-service`.
  - Meretas beban baca MySQL hingga 90% dengan menyajikan daftar produk dari RAM berlatensi *sub-millisecond*. Sistem membatalkan (*invalidate*) cache setiap ada operasi penulisan dari Administrator.

### 3.2 Pertahanan API Gateway & Reliabilitas
- **Circuit Breaker Pattern**
  - Implementasi mekanik pemutus arus (seperti pustaka `opossum`). Jika sub-layanan mengalami *Time-Out*, API Gateway memutus koneksi lalu lintas dengan cepat (*Fail-Fast*) daripada menunda respon klien.

### 3.3 Pembaruan Infrastruktur Kode Dasar (Codebase)
- **Evolusi TypeScript**
  - Refaktor basis kode dari *JavaScript* menuju bahasa statis terkompilasi (*TypeScript*) guna mengaktifkan *Type Safety* di tingkat korporasi.
- **Asynchronous Messaging (Message Broker / Event Stream)**
  - Pengadopsian **RabbitMQ** atau **Apache Kafka**.
  - Aplikasi: Saat pesanan tercetak, *Order Service* memublikasikan *Event* `OrderCreated` ke antrean. *Notification Service* menyerap log itu secara asinkron (Loose Coupling), menyokong resiliensi tanpa henti walau layanan lain sedang dalam siklus *Reboot*.

---

## 4. Peta Jalan Implementasi Penuh (Deployment Roadmap)

**Fase 1: Quick Wins (Minggu 1-2)**
- [ ] Injeksi Redis *caching* pada modul produk.
- [ ] Pemasangan *Circuit Breaker* pada layer API Gateway.

**Fase 2: Pemisahan Data & Keamanan Tipe (Minggu 3-6)**
- [ ] Transmutasi kode menuju TypeScript secara agresif.
- [ ] Partisi fisik dan logikal Pangkalan Data (`sistrackv2_auth`, dll).
- [ ] Rekonstruksi metode gRPC antar layanan.

**Fase 3: Full Distributed Event System (Minggu 7-8)**
- [ ] Topologi Antrean Pesan (RabbitMQ) pada Virtual Network Azure.
- [ ] Modul Analitik direkayasa ulang mengonsumsi *Event Streaming* mentah dari Kafka.

---

<div align="center">
  <b>SisTrackV2 Enterprise</b> &copy; 2026 Adam Yudhistira Muhtar. All Rights Reserved.<br>
  <i>Confidential & Proprietary Infrastructure Reference.</i>
</div>
