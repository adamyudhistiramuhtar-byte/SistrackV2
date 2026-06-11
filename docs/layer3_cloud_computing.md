# [LAYER 3] SistrackV2 Enterprise: Cloud Computing Scaling Architecture (Tugas Besar)

> **Document Version**: 3.0  
> **Last Updated**: June 2026  
> **Classification**: Confidential — Academic Final Project Deliverable  
> **Author**: Adam Yudhistira Muhtar  

## 1. Pendahuluan
Sebagai proyek pemenuhan standar level *Enterprise*, arsitektur komputasi SistrackV2 dituntut memiliki skalabilitas yang tak terhingga (*Infinite Scalability*). Dokumen ini menguraikan masa depan arsitektur yang melampaui fase 2 (Multi-VM Azure Load Balancer), dengan menyiapkan infrastruktur berbasis kontainer penuh (*Full Containerization*) di atas ekosistem **Amazon Web Services (AWS) / Azure Kubernetes Service (AKS)**.

---

## 2. Topologi Jaringan Taraf Eksekutif (Cloud Architecture Topology)

Sistem akan dieksekusi di atas infrastruktur **Virtual Private Cloud (VPC) / VNet** dengan isolasi zona *Multi-Availability Zone (Multi-AZ)* tingkat ekstrem.

### 2.1 Subnetting Strategy
- **DMZ Public Subnet**: Lini terdepan yang berisi *Application Load Balancer (ALB)* lapis 7, NAT Gateway, dan filter *Web Application Firewall (WAF)*.
- **Compute Private Subnet (App Tier)**: Menampung armada *worker nodes* untuk *Kubernetes Cluster* (EKS/AKS). Microservices akan mengapung secara dinamis pada kluster ini tanpa akses internet terbuka.
- **Vault Private Subnet (Data Tier)**: Level militer, benar-benar buta internet. Menjalankan *Managed Relational DB* dan kluster Memori Terdistribusi (Redis).

### 2.2 Arsitektur Diagram Konseptual
```
[Internet Publik] 
  ↓
[AWS WAF / Azure Front Door] (Filter DDoS & Eksploitasi)
  ↓
[Elastic / Standard Load Balancer] (Gateway Eksternal)
  ↓
[Kubernetes Ingress Controller] (Penyortir Lapis Aplikasi)
  ↓
[EKS / AKS Worker Nodes] (Microservices Pods)
  ↓
[PaaS Database & ElastiCache] (Data Isolasi Total)
```

---

## 3. Containerization Strategy

Seluruh infrastruktur (OS + Aplikasi) digembok dan dimuat ke dalam kontainer yang tidak bisa dimutasi (*Immutable Containers*).

### 3.1 Dockerfile Microservices Node.js
Setiap layanan akan dikompilasi menggunakan teknik **Multi-stage Build** untuk merampingkan aset dan mencegah eksploitasi keamanan:
1. **Builder Stage**: Mengerahkan image `node:20-alpine`, mengeksekusi kompilasi *TypeScript* dan instalasi modul C++.
2. **Production Stage**: Membuang pustaka pengembang (*DevDependencies*), hanya mentransfer kode *bytecode* akhir dan mejalankan *Node Runtime* murni.

### 3.2 Frontend Containerization
Antarmuka pengguna (Vue 3 / Vite) dikemas sebagai peladen Nginx mikro yang sangat teroptimasi (`nginx:alpine`), mendistribusikan *static assets* dengan performa maksimum dan kapabilitas rotasi *History API* mandiri.

---

## 4. Orkestrasi Kontainer via Kubernetes (EKS / AKS)

Kluster tidak lagi diatur secara manual oleh operator manusia, melainkan diorkestrasi secara matematis oleh kluster kecerdasan mesin Kubernetes.

1. **Deployments & Pods**: Konfigurasi mematenkan minimum 3 *Replicas* per layanan, diikat dengan *Horizontal Pod Autoscaler (HPA)* yang otomatis menduplikasi sistem ketika pelonjakan memori (*Traffic Burst*) melampaui 70%.
2. **Services & Ingress**: Komunikasi layanan internal via *ClusterIP*, sedangkan penetrasi dari *Load Balancer* difilter via aturan *NGINX Ingress Controller*.
3. **Vault & Secrets Manager**: Variabel lingkungan rahasia (*Environment Variables*) tidak lagi disimpan di peladen, melainkan disuntikkan secara aman via *AWS Secrets Manager / Azure Key Vault CSI driver*.

---

## 5. Pipeline Integrasi dan Pengiriman Berkelanjutan (CI/CD)

Penggelaran infrastruktur mengikuti budaya **DevSecOps** yang tidak memberikan toleransi kesalahan manual:

1. **Kode di-Push (Commit)**: Memicu siklus *GitHub Actions* korporasi.
2. **Uji Otomatis & Analisa Statis (CI)**: Mesin memeriksa integritas kode dan *Linting* secara presisi.
3. **Pembekuan Kontainer (Docker Push)**: Image dikunci dengan *Hash Kriptografi* dan disimpan ke registri *Container Registry*.
4. **Zero-Downtime Deployment (CD)**: Skrip secara dinamis me-rotasi *Pod* Kubernetes satu-persatu tanpa memutus aliran data koneksi Klien.

---

## 6. Observabilitas Panoptikon (Monitoring & Telemetry)

Membedah lalu lintas data yang melintasi sistem terdistribusi ini diatur dengan pusat pemantauan milidetik:
- **Metrics Aggregation**: Kluster **Prometheus** menghisap data vital dari Node.js (CPU, alokasi Garbage Collector), dan menampilkannya menjadi dasbor tempur **Grafana**.
- **Centralized Log Analytics**: Menggunakan **ELK Stack (Elasticsearch, Logstash, Kibana)**. Tidak ada lagi operator log manual; semua output terdistribusi ditelan dan dirangkum.
- **Distributed Tracing (Sinar-X Jaringan)**: Penetrasi layanan demi layanan diawasi ketat oleh **AWS X-Ray / Jaeger**, sehingga penundaan satu fungsi dapat diisolasi seketika.

---

<div align="center">
  <b>SisTrackV2 Enterprise</b> &copy; 2026 Adam Yudhistira Muhtar. All Rights Reserved.<br>
  <i>Confidential & Proprietary Infrastructure Reference.</i>
</div>
