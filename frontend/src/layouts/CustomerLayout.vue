<template>
  <div class="customer-layout">
    <header class="header">
      <div class="header-inner">
        <div class="logo">
          SistrackV2 Coffee
        </div>
      </div>
    </header>
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

.header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 16px 22px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-inner {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 20px;
  letter-spacing: -0.5px;
  color: var(--text);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
