<template>
  <div class="cart">
    <div class="head">
      <div>
        <div class="title">Cart</div>
        <div class="sub">Ringkasan pesanan</div>
      </div>
      <span class="badge">{{ items.length }} item</span>
    </div>

    <div class="divider"></div>

    <div v-if="items.length === 0" class="empty">
      Belum ada item
    </div>

    <div v-else class="list">
      <div v-for="it in items" :key="it.id" class="row">
        <div class="meta">
          <div class="nm">{{ it.name }}</div>
          <div class="pr">Rp {{ format(it.price) }}</div>
        </div>

        <div class="qty">
          <button class="qbtn" @click="$emit('decrease', it)">−</button>
          <span class="qnum">{{ it.qty }}</span>
          <button class="qbtn" @click="$emit('increase', it)">+</button>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="total">
      <span>Total</span>
      <span>Rp {{ format(total) }}</span>
    </div>

    <button
      class="checkout"
      :disabled="items.length === 0"
      @click="$emit('checkout')"
    >
      Checkout
    </button>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true },
  total: { type: Number, required: true }
})
defineEmits(['increase','decrease','checkout'])

const format = (n) =>
  new Intl.NumberFormat('id-ID').format(Number(n || 0))
</script>

<style scoped>
.cart{
  padding:20px;
  background:transparent;
  font-family: 'DM Sans', sans-serif;
}

.head{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.title{ 
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}
.sub{ 
  font-size: 11px; 
  color: var(--text-muted);
  margin-top: 2px;
}

.empty{
  padding: 40px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
  font-family: 'Playfair Display', serif;
}

.list{
  display:flex;
  flex-direction:column;
  gap:10px;
}

.row{
  display:flex;
  justify-content:space-between;
  gap:12px;
  padding:12px;
  border-radius:12px;
  border:1px solid var(--border);
  background:var(--surface);
}

.nm{
  font-weight: 600;
  font-size: 13px;
  color: var(--text);
}
.pr{ 
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.qty{
  display:flex;
  align-items:center;
  gap:8px;
}

.qbtn{
  width:28px;
  height:28px;
  border-radius:8px;
  border:1px solid var(--border);
  background:transparent;
  color:var(--text);
  font-weight:500;
  cursor:pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qbtn:hover{
  background:var(--border);
}

.qnum{
  min-width:16px;
  text-align:center;
  font-weight:600;
  font-size:13px;
  color:var(--text);
}

.total{
  display:flex;
  justify-content:space-between;
  align-items: baseline;
  font-weight:700;
  color:var(--text);
}

.total span:first-child {
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  color: var(--text-muted);
}

.total span:last-child {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
}

.checkout{
  width:100%;
  margin-top:18px;
  padding:12px;
  border-radius:12px;
  background: var(--accent);
  color: #fff;
  font-weight:700;
  border:none;
  cursor:pointer;
  font-family: 'DM Sans', sans-serif;
  letter-spacing: 0.02em;
  transition: opacity 0.2s, transform 0.15s;
}

.checkout:hover:not(:disabled){
  opacity: 0.92;
  transform: translateY(-1px);
}

.checkout:disabled{
  opacity:.4;
  cursor:not-allowed;
}
</style>
