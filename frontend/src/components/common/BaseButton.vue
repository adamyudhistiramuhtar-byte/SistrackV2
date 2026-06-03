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
  background: var(--surface);
  color: var(--text);
  font-weight: 800;
  cursor: pointer;
  transition: background .15s, color .15s, opacity .15s, transform .15s;
  font-family: inherit;
}

.btn:hover:not(:disabled){
  background: var(--border);
  transform: translateY(-1px);
}

.btn-primary{
  background: var(--accent);
  color: #ffffff;
  border-color: transparent;
}

.btn-primary:hover:not(:disabled){
  opacity: 0.92;
  background: var(--accent);
}

.btn:disabled{
  opacity: .5;
  cursor: not-allowed;
}
</style>
