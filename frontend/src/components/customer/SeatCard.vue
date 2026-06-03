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
  border: 1px solid var(--border);
  background: rgb(255, 255, 255);
  font-weight: 800;
}

.seat.active{
  background: var(--black);
  color: var(--white);
}
</style>
