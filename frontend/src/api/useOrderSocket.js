import { ref, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

export function useOrderSocket(orderId, gatewayUrl = 'http://localhost:3004') {
  const socket = io(gatewayUrl);
  const currentStatus = ref('');
  const statusLabel = ref('');

  socket.on('connect', () => {
    if (orderId) {
      socket.emit('join:order', orderId);
    } else {
      socket.emit('join:admin');
    }
  });

  socket.on('order:status_changed', (data) => {
    if (data.orderId === orderId || !orderId) {
      currentStatus.value = data.status;
      statusLabel.value = data.statusLabel;
    }
  });

  onUnmounted(() => {
    socket.disconnect();
  });

  return {
    socket,
    currentStatus,
    statusLabel,
  };
}
