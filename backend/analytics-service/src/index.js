require('dotenv').config();

const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // IMP-015: Tambah CORS untuk Admin
const validateEnv = require('../../shared/validateEnv');

// IMP-001: Validasi Environment untuk Analytics Service
validateEnv(['PORT', 'DB_HOST', 'DB_USER', 'DB_NAME']);

const { createAnalyticsHandlers, getPool } = require('./services/analytics.grpc');

const PROTO_PATH = path.join(__dirname, 'proto', 'analytics.proto');

const start = async () => {
  // start gRPC server
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const proto = grpc.loadPackageDefinition(packageDefinition);
  const analyticsPkg = proto.analytics;

  const server = new grpc.Server();
  const handlers = await createAnalyticsHandlers();
  server.addService(analyticsPkg.AnalyticsService.service, handlers);

  const grpcPort = Number(process.env.PORT || 50051); // IMP-006: Sesuaikan dengan PM2 env PORT
  server.bindAsync(
    `0.0.0.0:${grpcPort}`,
    grpc.ServerCredentials.createInsecure(),
    (err) => {
      if (err) {
        console.error('Failed to bind gRPC server:', err.message);
        process.exit(1);
      }
      console.log(`Analytics gRPC Service running on port ${grpcPort}`);
      server.start();
    }
  );

  // start HTTP receiver for events & dashboard summary
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  app.get('/health', (req, res) => res.json({ service: 'analytics-service', status: 'ok' }));

  const pool = getPool();

  // Endpoint untuk receive event secara HTTP (Legacy fallback)
  app.post('/events', async (req, res) => {
    try {
      const { type, payload } = req.body || {};
      if (!type || !payload) return res.status(400).json({ success: false, message: 'Invalid event' });

      if (type === 'ORDER_CREATED') {
        const total = Number(payload.total || payload.total_amount || 0);
        await pool.query(
          'INSERT INTO orders (total_amount, status, completed_at) VALUES (?, ?, NOW())',
          [total, 'completed']
        );
        console.log('[ANALYTICS] ORDER_CREATED processed, total=', total);
        return res.json({ success: true });
      }

      return res.status(400).json({ success: false, message: 'Unhandled event type' });
    } catch (err) {
      console.error('[ANALYTICS EVENTS ERROR]', err.message);
      return res.status(500).json({ success: false, message: 'Internal error' });
    }
  });

  // IMP-015: Endpoint HTTP untuk admin mengambil data analitik ringkasan
  app.get('/summary', async (req, res) => {
    try {
      // Gunakan handler gRPC internal untuk konsistensi
      const request = { date_from: req.query.date_from || '', date_to: req.query.date_to || '' };
      
      handlers.GetSummary({ request }, (err, response) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Failed to retrieve summary' });
        }
        res.json({ success: true, data: response });
      });
    } catch (err) {
      console.error('[ANALYTICS SUMMARY ERROR]', err.message);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  });

  const httpPort = Number(process.env.ANALYTICS_HTTP_PORT || 3006);
  app.listen(httpPort, () => console.log(`Analytics HTTP event receiver & admin summary running on port ${httpPort}`));
};

start();
