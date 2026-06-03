<template>
  <div class="prod">
    <div class="info">
      <div class="name">{{ product.name }}</div>
      <div class="price">Rp {{ format(product.price) }}</div>
    </div>

    <button class="add" @click="$emit('add', product)">
      Tambah
    </button>
  </div>
</template>

<script setup>
defineProps({
  product: { type: Object, required: true }
})
defineEmits(['add'])

const format = (n) =>
  new Intl.NumberFormat('id-ID').format(Number(n || 0))
</script>

<style scoped>
.prod{
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  gap:12px;
  padding:16px;
  border-radius:18px;
  border:1px solid var(--border);
  background: linear-gradient(
    180deg,
    rgba(255,255,255,.05),
    rgba(255,255,255,.02)
  );
  min-height:120px;
}

.info{
  display:flex;
  flex-direction:column;
  gap:4px;
}

.name{
  font-weight:800;
  letter-spacing:-.2px;
}

.price{
  font-size:13px;
  color:var(--muted);
}

.add{
  width:100%;
  border-radius:14px;
  border:1px solid var(--border);
  background:#0f0f10;
  color:var(--text);
  padding:10px;
  font-weight:800;
  cursor:pointer;
}
.add:hover{
  background:rgba(255,255,255,.08);
}
</style>
