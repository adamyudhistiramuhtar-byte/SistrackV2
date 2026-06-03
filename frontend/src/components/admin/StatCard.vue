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
  background: var(--surface);
  border-radius: 16px;
  padding: 14px;
  box-shadow: var(--shadow);
}
.label{ font-size: 12px; color: var(--text-muted); }
.val{ font-size: 22px; font-weight: 900; margin-top: 6px; color: var(--text); }
.hint{ font-size: 12px; color: var(--text-muted); margin-top: 6px; }
</style>
