<template>
  <button class="seat" :class="{ active }" @click="$emit('pick', number)">
    {{ number }}
  </button>
</template>

<script setup>
defineProps({
  number: { type: Number, required: true },
  active: { type: Boolean, default: false },
})
defineEmits(['pick'])
</script>

<style scoped>
.seat{
  height: 48px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.seat:hover {
  background: var(--border);
  border-color: var(--text-muted);
  transform: translateY(-2px);
}

.seat.active{
  background: var(--accent);
  color: #FFFFFF;
  border-color: transparent;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
