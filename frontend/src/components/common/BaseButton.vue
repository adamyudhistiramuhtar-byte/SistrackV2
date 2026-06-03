<template>
  <button
    class="btn"
    :class="{ 'btn-primary': primary }"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  primary: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
defineEmits(['click'])
</script>

<style scoped>
.btn{
  height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #0f0f10;
  color: var(--text);
  font-weight: 800;
  cursor: pointer;
  transition: background .15s, color .15s, opacity .15s;
}

.btn:hover{
  background: #151516;
}

.btn-primary{
  background: var(--white);
  color: var(--black);
  border-color: transparent;
}

.btn:disabled{
  opacity: .5;
  cursor: not-allowed;
}
</style>
