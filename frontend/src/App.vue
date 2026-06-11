<template>
  <RouterView />
  <div v-if="serverId" class="server-badge">
    🖥️ {{ serverId }}
  </div>
</template>

<script setup>
const serverId = import.meta.env.VITE_APP_SERVER_ID || '';
</script>

<style>
.server-badge {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #00ffcc;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: bold;
  font-family: monospace;
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0,255,204,0.3);
  border: 1px solid #00ffcc;
  backdrop-filter: blur(4px);
}
</style>
