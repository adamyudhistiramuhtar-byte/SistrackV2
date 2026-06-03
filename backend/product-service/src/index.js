require('dotenv').config();

// IMP-001: Validasi env vars
const validateEnv = require('../../shared/validateEnv');
validateEnv(['PORT', 'DB_HOST', 'DB_USER', 'DB_NAME']);

const express = require('express');
const cors = require('cors');
const { errorHandler, notFoundHandler } = require('../../shared/errorHandler');
const productRoutes = require('./routes/product.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/products', productRoutes);

app.get('/health', (req, res) => {
  res.json({ service: 'product-service', status: 'ok' });
});

// IMP-007: Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});
