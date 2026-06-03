# [LAYER 3] Dokumentasi Cloud Computing (Tugas Besar)

## 1. Pendahuluan
Sebagai bagian dari pemenuhan standar aplikasi level *Enterprise*, arsitektur SistrackV2 yang berbasis *Microservices* menuntut solusi infrastruktur (*deployment*) yang *scalable*, aman, dan tangguh (*resilient*). Dokumen ini merancang strategi adopsi *Cloud Computing* secara menyeluruh, dirancang menggunakan penyedia layanan *cloud* **Amazon Web Services (AWS)**.

---

## 2. Cloud Architecture Topology (AWS)

Arsitektur akan dibangun di atas **Virtual Private Cloud (VPC)** yang diatur dengan *Multi-Availability Zone (Multi-AZ)* untuk toleransi kesalahan (*fault tolerance*).

### 2.1 Subnetting Strategy
- **Public Subnet**: Digunakan untuk *Application Load Balancer (ALB)*, NAT Gateway, dan *Bastion Host* (jika diperlukan untuk manajemen).
- **Private Subnet (App Tier)**: Menjalankan *worker nodes* untuk *Kubernetes Cluster* (Amazon EKS) yang meng-host layanan-layanan (Auth, Product, Order, Gateway).
- **Private Subnet (Data Tier)**: Berisi layanan *Managed Database* (Amazon RDS) dan layanan *Caching* (Amazon ElastiCache). Subnet ini sangat terisolasi tanpa akses internet langsung sama sekali.

### 2.2 Arsitektur Diagram (*Logical*)
*(Konseptual)*
Internet $\rightarrow$ **AWS WAF** $\rightarrow$ **Internet Gateway** $\rightarrow$ **Application Load Balancer** $\rightarrow$ **EKS Cluster (Private App Tier)** $\rightarrow$ **RDS & ElastiCache (Private Data Tier)**.

---

## 3. Containerization Strategy

Langkah pertama menuju *Cloud* adalah mengemas sistem *backend* dan *frontend* menggunakan **Docker**.

### 3.1 Dockerfile untuk Microservices (Node.js)
Setiap layanan (*Gateway*, *Auth*, *Product*, dll.) akan memiliki *Dockerfile* standar yang optimal menggunakan *Multi-stage Build*:
1. **Build Stage**: Menggunakan image `node:18-alpine`, menginstal dependensi (`npm install`), dan mengompilasi aset atau tipe data (jika memakai TypeScript).
2. **Production Stage**: Hanya menyalin file biner (*production ready*), tidak meng-copy `devDependencies`, dan menjalankan *runtime* aplikasi.

### 3.2 Frontend Containerization
Aplikasi Vue 3 (Vite) dikemas ke dalam *container* Nginx (misal: `nginx:alpine`). Nginx tidak hanya menyajikan *static file* yang telah di-*build*, namun juga bertindak menangani *routing* berbasis *history* untuk *Single Page Application* (SPA).

---

## 4. Orchestration menggunakan Kubernetes (Amazon EKS)

Sistem didistribusikan di atas **Amazon Elastic Kubernetes Service (EKS)**.
Berikut adalah manifest/objek kunci yang akan di-*deploy*:

1. **Deployments & Pods**: Setiap *service* dideklarasikan dalam `Deployment` dengan konfigurasi minimum 2 *replicas* (untuk ketersediaan tinggi) dan *Horizontal Pod Autoscaler (HPA)* berbasis utilisasi CPU atau Memory.
2. **Services**: Komunikasi antar *microservices* internal dalam kluster menggunakan Kubernetes Service bertipe `ClusterIP`. API Gateway mengekspos dirinya menggunakan NGINX Ingress Controller.
3. **ConfigMaps & Secrets**:
   - **ConfigMap**: Menyimpan konfigurasi non-sensitif (port, URL *service* lain).
   - **Secrets**: Terintegrasi dengan AWS Secrets Manager (misal lewat *CSI driver*) untuk menyuntikkan kredensial database dan kunci rahasia (JWT_SECRET) ke dalam kontainer.

---

## 5. Database & Caching Services (Managed Cloud)

Untuk mengurangi beban operasional pemeliharaan basis data, skema migrasi diarahkan menggunakan model *DB-as-a-Service*:
- **Relational Database**: **Amazon RDS for MySQL** dengan *Multi-AZ Deployment* dan fitur *auto-backup* harian. Di kemudian hari, saat database dipecah per-service (sesuai *Improvement Project Layer 2*), bisa dibuat multi-*database instances* dalam RDS yang sama.
- **In-Memory Cache**: **Amazon ElastiCache for Redis**, yang dapat menangani jutaan *requests per second* dengan latensi sub-milidetik, vital untuk *product catalog* (*Product Service*).

---

## 6. Pipeline CI/CD (Continuous Integration & Continuous Deployment)

Menggunakan **GitHub Actions** atau **AWS CodePipeline**, alur kerjanya adalah sebagai berikut:
1. **Push ke Branch `main`**: *Trigger event*.
2. **Linting & Unit Test (CI)**: Menjalankan tes otomatis pada kode Node.js dan Vue.js.
3. **Build & Push Docker Image**: Melakukan *build* image Docker, lalu di-*push* menuju **Amazon Elastic Container Registry (ECR)** dengan tag spesifik berbasis *commit hash* (*immutable tags*).
4. **Deploy ke EKS (CD)**: Memperbarui manifes Kubernetes di repositori (mengubah versi *image tag*) menggunakan `kubectl set image` atau metode GitOps seperti *ArgoCD*, lalu menerapkan ke kluster secara *rolling update* agar *zero-downtime*.

---

## 7. Monitoring & Observability

Karena memantau banyak kontainer yang terdistribusi (*microservices*) lebih rumit dibandingkan sistem monolitik, dibutuhkan *observability layer*:
- **Metrics**: **Prometheus** untuk mengumpulkan metrik dari Node.js (CPU, jumlah *request*) dan infrastruktur (metrik Kubernetes Node). Data tersebut divisualisasikan menjadi dasbor *real-time* di **Grafana**.
- **Centralized Logging**: Menggunakan tumpukan **EFK (Elasticsearch, Fluentd/Fluent Bit, Kibana)** atau AWS CloudWatch Logs. Semua log keluaran standar (`stdout`) dari setiap kontainer di-*scrape* oleh Fluent Bit dan dikirim ke agregator log, mempermudah pelacakan (misal melacak *Order ID* antar *service*).
- **Distributed Tracing**: Integrasi **AWS X-Ray** atau *Jaeger* untuk melihat jalur (*trace*) satu *request user* mulai dari Gateway $\rightarrow$ Auth $\rightarrow$ Product, guna melacak titik spesifik yang menjadi penyebab perlambatan atau *error*.
