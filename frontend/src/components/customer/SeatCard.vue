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
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.seat:hover {
  background: rgba(255, 255, 255, 0.1);
}

.seat.active{
  background: white;
  color: black;
  border-color: white;
  transform: scale(1.05);
}
</style>
