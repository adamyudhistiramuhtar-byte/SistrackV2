<template>
  <div class="customer-layout">
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.customer-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
