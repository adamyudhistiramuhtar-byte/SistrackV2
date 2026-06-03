const { createProxyMiddleware } = require('http-proxy-middleware');
const { verifyToken } = require('../middlewares/auth.middleware');
const { getDashboardSummary } = require('../grpc/analytics.client');
const axios = require('axios');

const makeProxy = (mountPath, target, opts = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    logLevel: 'silent',
    pathRewrite: (path, req) => {
      const orig = req.originalUrl || req.url || path;
      // rewrite only the mount prefix to the downstream root
      const rewritten = orig.replace(new RegExp('^' + mountPath), (mountPath === '/api/auth' ? '/auth' : mountPath.replace(/^\/api/, '')));
      // attach a header for debugging
      req.headers['x-proxy-rewrite'] = `${orig} -> ${rewritten}`;
      return rewritten;
    },
    onProxyReq: (proxyReq, req, res) => {
      // If body was parsed by express (json), forward it to the proxied request
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        try {
          proxyReq.write(bodyData);
        } catch (e) {
          // ignore
        }
      }
    },
    ...opts,
  });
};

module.exports = (app) => {
  // normalize double '/api/api' requests from frontend (frontend mistakenly prefixes '/api' twice)
  app.use((req, res, next) => {
    if (req.originalUrl && req.originalUrl.startsWith('/api/api')) {
      const fixed = req.originalUrl.replace(/^\/api\/api/, '/api');
      req.url = fixed;
      // also update originalUrl so downstream middlewares (and our pathRewrite) see the normalized path
      req.originalUrl = fixed;
    }
    next();
  });

  // AUTH
  // For login specifically, forward via axios to avoid proxy body forwarding issues
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('[GATEWAY AUTH LOGIN]', 'forwarding login to', process.env.AUTH_SERVICE_URL, 'rawBody=', req.rawBody);
      // prefer rawBody when present to avoid double-parsing / quoting issues
      const payload = typeof req.rawBody === 'string' && req.rawBody.length ? req.rawBody : JSON.stringify(req.body || {});
      const resp = await axios.post(`${process.env.AUTH_SERVICE_URL}/auth/login`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
      return res.status(resp.status).json(resp.data);
    } catch (err) {
      console.error('[GATEWAY AUTH LOGIN ERROR]', err && err.message);
      const status = (err && err.response && err.response.status) || 502;
      const data = (err && err.response && err.response.data) || { success: false, message: 'Auth proxy error' };
      return res.status(status).json(data);
    }
  });

  // debug logger for auth proxy to help trace why other auth requests fail
  app.use('/api/auth', (req, res, next) => {
    try {
      console.log('[GATEWAY AUTH DEBUG]', req.method, 'originalUrl=', req.originalUrl, 'url=', req.url, 'body=', JSON.stringify(req.body || {}));
    } catch (e) {}
    next();
  });

  app.use('/api/auth', makeProxy('/api/auth', process.env.AUTH_SERVICE_URL));

  // PUBLIC PRODUCTS (no auth)
  app.use('/api/products/available', makeProxy('/api/products/available', process.env.PRODUCT_SERVICE_URL));

  // ADMIN PRODUCTS (require auth)
  app.use('/api/products', verifyToken, makeProxy('/api/products', process.env.PRODUCT_SERVICE_URL));

  // ORDERS
  // For order creation, use axios forward to ensure body preserved
  app.post('/api/orders', async (req, res) => {
    try {
      console.log('[GATEWAY ORDER CREATE] forwarding to', process.env.ORDER_SERVICE_URL, 'rawBody=', req.rawBody);
      const payload = typeof req.rawBody === 'string' && req.rawBody.length ? req.rawBody : JSON.stringify(req.body || {});
      const resp = await axios.post(`${process.env.ORDER_SERVICE_URL}/orders`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
      return res.status(resp.status).json(resp.data);
    } catch (err) {
      console.error('[GATEWAY ORDER CREATE ERROR]', err && err.message);
      const status = (err && err.response && err.response.status) || 502;
      const data = (err && err.response && err.response.data) || { success: false, message: 'Order proxy error' };
      return res.status(status).json(data);
    }
  });

  app.use('/api/orders', (req, res, next) => {
    try {
      console.log('[GATEWAY ORDER DEBUG]', req.method, 'originalUrl=', req.originalUrl, 'url=', req.url, 'body=', JSON.stringify(req.body || {}));
    } catch (e) {}
    next();
  });
  app.use('/api/orders', makeProxy('/api/orders', process.env.ORDER_SERVICE_URL));

  // SESSION
  app.post('/api/session/seat', async (req, res) => {
    try {
      const payload = typeof req.rawBody === 'string' && req.rawBody.length ? req.rawBody : JSON.stringify(req.body || {});
      const resp = await axios.post(`${process.env.ORDER_SERVICE_URL}/session/seat`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
      return res.status(resp.status).json(resp.data);
    } catch (err) {
      const status = (err && err.response && err.response.status) || 502;
      const data = (err && err.response && err.response.data) || { success: false, message: 'Session proxy error' };
      return res.status(status).json(data);
    }
  });
  // ANALYTICS via gRPC
  app.get('/api/analytics/dashboard', verifyToken, async (req, res) => {
    try {
      const data = await getDashboardSummary();
      res.json({ success: true, data });
    } catch (err) {
      res.status(502).json({ success: false, message: 'Failed to fetch analytics' });
    }
  });
};
