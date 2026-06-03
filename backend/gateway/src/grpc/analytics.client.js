const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, '..', 'proto', 'analytics.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const loadedProto = grpc.loadPackageDefinition(packageDefinition);

if (
  !loadedProto ||
  !loadedProto.analytics ||
  !loadedProto.analytics.AnalyticsService
) {
  throw new Error('AnalyticsService not found in proto. File mismatch.');
}

const AnalyticsService = loadedProto.analytics.AnalyticsService;

const client = new AnalyticsService(
  process.env.ANALYTICS_GRPC_URL,
  grpc.credentials.createInsecure()
);

const getDashboardSummary = () => {
  return new Promise((resolve, reject) => {
    client.GetDashboardSummary({}, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
};

module.exports = { getDashboardSummary };
