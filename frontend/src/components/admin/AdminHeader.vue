<template>
  <div class="hdr">
    <div>
      <div class="ttl">{{ title }}</div>
      <div class="sub">{{ subtitle }}</div>
    </div>

    <div class="row">
      <span class="badge">Realtime: {{ realtime ? 'ON' : 'OFF' }}</span>
      <button class="logout" @click="$emit('logout')">Logout</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Dashboard' },
  subtitle: { type: String, default: '' },
  realtime: { type: Boolean, default: false },
})
defineEmits(['logout'])
</script>

<style scoped>
.hdr{
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  gap: 12px;
  margin-bottom: 16px;
}
.ttl{ font-size: 34px; font-weight: 900; letter-spacing: -0.02em; }
.sub{ font-size: 13px; color: var(--muted); margin-top: 6px; }
.logout{
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}
.logout:hover {
  background: var(--border);
}
</style>
