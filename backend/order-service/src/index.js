require('dotenv').config();

// IMP-001: Validasi env vars
const validateEnv = require('../../../shared/validateEnv');
validateEnv(['PORT', 'DB_HOST', 'DB_USER', 'DB_NAME']);

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { errorHandler, notFoundHandler } = require('../../../shared/errorHandler');
const orderRoutes = require('./routes/order.routes');
const sessionRoutes = require('./routes/session.routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/orders', orderRoutes);
app.use('/session', sessionRoutes);

app.get('/health', (req, res) => {
  res.json({ service: 'order-service', status: 'ok' });
});

// IMP-007: Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

// default port for order-service is 3003
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
