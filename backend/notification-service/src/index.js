require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());
const server = http.createServer(app);

// IMP-011: Socket.IO Setup with CORS and Namespaces
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    }
  }
});

io.on('connection', (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id}`);
  
  // Admin bergabung ke room global admin
  socket.on('join:admin', () => {
    socket.join('admin_room');
    console.log(`[SOCKET] Admin ${socket.id} joined admin_room`);
  });

  // Customer bergabung ke room order spesifik
  socket.on('join:order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`[SOCKET] Customer ${socket.id} joined order_${orderId}`);
  });
});

// IMP-011: Endpoint INTERNAL (dipanggil dari order-service)
app.post('/internal/notify/new-order', (req, res) => {
  const { orderId, seatNumber, customerName, totalAmount } = req.body;
  io.to('admin_room').emit('order:new', { orderId, seatNumber, customerName, totalAmount, at: new Date() });
  res.json({ ok: true });
});

app.post('/internal/notify/status-changed', (req, res) => {
  const { orderId, status, statusLabel } = req.body;
  io.to(`order_${orderId}`).emit('order:status_changed', { orderId, status, statusLabel });
  res.json({ ok: true });
});

app.get('/health', (req, res) => {
  res.json({ service: 'notification-service', status: 'ok' });
});

// Jalankan server
const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});
