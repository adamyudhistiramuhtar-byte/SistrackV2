<template>
  <div class="prod" :class="{ 'is-disabled': !product.is_available }">
    <div class="content">
      <div class="info">
        <div class="name">
          {{ product.name }}
          <span v-if="!product.is_available" style="font-size: 10px; background: rgba(255,0,0,0.2); color: #ff4d4d; padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle;">HABIS</span>
        </div>
        <div class="price">Rp {{ format(product.price) }}</div>
      </div>

      <button 
        class="add" 
        :disabled="!product.is_available" 
        @click="$emit('add', product)"
      >
        <svg v-if="product.is_available" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span v-else>Habis</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  product: { type: Object, required: true }
})
defineEmits(['add'])

const format = (n) =>
  new Intl.NumberFormat('id-ID').format(Number(n || 0))
</script>

<style scoped>
.prod {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  backdrop-filter: blur(10px);
}

.prod:not(.is-disabled):hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
}

.content {
  padding: 16px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.name {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.2px;
  line-height: 1.2;
}

.price {
  font-size: 13px;
  color: var(--ok);
  font-weight: 600;
}

.add {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.add:not(:disabled):hover {
  background: white;
  color: black;
  transform: scale(1.05);
}

.is-disabled {
  opacity: 0.6;
}
.is-disabled .add {
  width: auto;
  padding: 0 10px;
  font-size: 11px;
  background: transparent;
  cursor: not-allowed;
  border-color: transparent;
  color: var(--muted);
}
</style>
