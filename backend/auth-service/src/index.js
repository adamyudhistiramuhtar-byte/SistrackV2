
require('dotenv').config();

// IMP-001: Validasi env vars
const validateEnv = require('../../../shared/validateEnv');
validateEnv(['PORT', 'DB_HOST', 'DB_USER', 'DB_NAME']);

const express = require('express');
const cors = require('cors');
const { errorHandler, notFoundHandler } = require('../../../shared/errorHandler');
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(cors());
const bodyParser = require('body-parser');
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      try {
        req.rawBody = buf && buf.length ? buf.toString('utf8') : '';
      } catch (e) {
        req.rawBody = '';
      }
    },
  })
);

app.use('/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'ok' });
});

// IMP-007: Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
