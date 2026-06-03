const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Asumsi analytics.proto di-copy ke order-service atau menggunakan path absolute/relative ke folder aslinya.
// Di sini kita gunakan relative path ke folder analytics-service untuk simplisitas monorepo lokal.
const PROTO_PATH = path.resolve(__dirname, '../../../../analytics-service/src/proto/analytics.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const analyticsProto = protoDescriptor.analytics;

const client = new analyticsProto.AnalyticsService(
  process.env.ANALYTICS_GRPC_URL || 'localhost:50051',
  grpc.credentials.createInsecure()
);

module.exports = client;
