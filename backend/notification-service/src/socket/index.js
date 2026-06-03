const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.of('/admin').on('connection', (socket) => {
    console.log('[SOCKET] Admin connected');
  });

  io.of('/customer').on('connection', (socket) => {
    console.log('[SOCKET] Customer connected');
  });
};

const emitAdmin = (event, payload) => {
  if (!io) return;
  io.of('/admin').emit(event, payload);
};

const emitCustomer = (event, payload) => {
  if (!io) return;
  io.of('/customer').emit(event, payload);
};

module.exports = {
  initSocket,
  emitAdmin,
  emitCustomer,
};
