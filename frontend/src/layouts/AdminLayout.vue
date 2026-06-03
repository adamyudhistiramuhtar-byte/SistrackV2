<template>
  <div class="admin-layout">
    <header class="admin-header">
      Admin Panel
    </header>
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
}
.admin-header {
  padding: 16px;
  background: var(--accent);
  color: #fff;
  font-weight: 600;
}
.admin-main {
  padding: 24px;
  flex: 1;
}
</style>
