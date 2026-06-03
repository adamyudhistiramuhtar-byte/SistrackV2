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
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #f0d9b0;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.seat:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.seat.active{
  background: linear-gradient(135deg, #b8721e, #d4943a);
  color: #1a1108;
  border-color: transparent;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(200, 135, 42, 0.3);
}
</style>
