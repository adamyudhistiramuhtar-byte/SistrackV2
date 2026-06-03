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
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  padding: 16px 22px;
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(10px);
  background: rgba(15, 15, 16, 0.85);
}

.header-inner {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  font-weight: 900;
  font-size: 18px;
  letter-spacing: -0.5px;
  background: linear-gradient(90deg, #fff, #aaa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
