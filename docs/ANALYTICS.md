# Analytics Service Documentation

## Overview
Analytics Service adalah microservice berbasis Node.js yang bertugas merekam dan menyediakan metrik pesanan (orders) menggunakan kombinasi **gRPC** (untuk kinerja tinggi komunikasi antar-service) dan **HTTP** (untuk akses admin dashboard/gateway).

## Arsitektur & Peran
- **gRPC Server (Port 50051)**: Digunakan oleh `order-service` untuk mengirimkan data order yang baru saja diselesaikan. Format kontrak (protobuf) terletak di `proto/analytics.proto`.
- **HTTP Server (Port 3006)**: Digunakan oleh API Gateway atau Frontend Admin untuk mengambil agregasi data pendapatan harian/bulanan.

## API Endpoint (HTTP)

### 1. `GET /summary`
Mengembalikan agregat data penjualan (total order, pendapatan, dan rata-rata pesanan) berdasarkan rentang waktu tertentu.

**Query Parameters:**
- `date_from` (Opsional): Format `YYYY-MM-DD` (contoh: `2024-01-01`).
- `date_to` (Opsional): Format `YYYY-MM-DD` (contoh: `2024-12-31`).

**Response Success:**
```json
{
  "success": true,
  "data": {
    "total_orders": 120,
    "total_revenue": 15000000.00,
    "average_order": 125000.00
  }
}
```

## Contract (gRPC)

Service: `AnalyticsService`

### `rpc RecordOrderCompleted(OrderEvent) returns (Ack)`
Dikirim oleh `order-service` saat status sebuah order berubah menjadi `completed`.

**Message `OrderEvent`:**
- `order_id` (int32)
- `total` (float)
- `date` (string) - `YYYY-MM-DD`
- `item_count` (int32)

### `rpc GetSummary(SummaryRequest) returns (SummaryResponse)`
Method internal gRPC untuk mengambil agregat. (Juga diekspos melalui `GET /summary` HTTP).
