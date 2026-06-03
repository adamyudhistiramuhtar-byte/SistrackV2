<template>
  <div class="base-card">
    <slot />
  </div>
</template>

<style scoped>
.base-card{
  width: 100%;
  background: rgba(255,255,255,.03);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
}
</style>
