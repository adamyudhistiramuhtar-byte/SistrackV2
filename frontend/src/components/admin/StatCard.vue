<template>
  <div class="stat">
    <div class="label">{{ label }}</div>
    <div class="val">{{ value }}</div>
    <div class="hint">{{ hint }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  hint: { type: String, default: '' },
})
</script>

<style scoped>
.stat{
  border: 1px solid var(--border);
  background: rgba(255,255,255,.03);
  border-radius: 16px;
  padding: 14px;
}
.label{ font-size: 12px; color: var(--muted); }
.val{ font-size: 22px; font-weight: 900; margin-top: 6px; }
.hint{ font-size: 12px; color: var(--muted2); margin-top: 6px; }
</style>
