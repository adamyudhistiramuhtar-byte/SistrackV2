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
  padding:18px;
  border-radius:20px;
  border:1px solid var(--border);
  background:linear-gradient(
    180deg,
    rgba(255,255,255,.05),
    rgba(255,255,255,.02)
  );
}

.head{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.title{ font-weight:900; }
.sub{ font-size:12px; color:var(--muted); }

.empty{
  padding:20px 0;
  text-align:center;
  color:var(--muted);
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
  padding:10px;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.2);
}

.nm{ font-weight:800; }
.pr{ font-size:12px; color:var(--muted); }

.qty{
  display:flex;
  align-items:center;
  gap:10px;
}

.qbtn{
  width:34px;
  height:34px;
  border-radius:10px;
  border:1px solid var(--border);
  background:#0f0f10;
  color:var(--text);
  font-weight:900;
  cursor:pointer;
}

.qnum{
  min-width:20px;
  text-align:center;
  font-weight:900;
}

.total{
  display:flex;
  justify-content:space-between;
  font-weight:900;
}

.checkout{
  width:100%;
  margin-top:14px;
  padding:12px;
  border-radius:16px;
  background:#fff;
  color:#000;
  font-weight:900;
  border:none;
  cursor:pointer;
}

.checkout:disabled{
  opacity:.5;
  cursor:not-allowed;
}
</style>
