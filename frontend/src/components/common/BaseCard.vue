<template>
  <div class="base-card">
    <slot />
  </div>
</template>

<style scoped>
.base-card{
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow);
}
</style>
