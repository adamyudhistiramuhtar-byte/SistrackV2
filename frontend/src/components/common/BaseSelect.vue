<template>
  <select
    class="select"
    :value="modelValue"
    @change="$emit('update:modelValue', $event.target.value)"
  >
    <slot />
  </select>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.select{
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-weight: 700;
  font-family: inherit;
  transition: border-color 0.2s;
}
.select:focus{
  outline: none;
  border-color: var(--accent);
}
</style>
