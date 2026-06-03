<template>
  <div class="menu-page">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <h1 class="page-title">Menu</h1>
        <p class="page-sub">Pilih menu dan masukin ke cart</p>
      </div>
      <div class="topbar-right">
        <div class="badge-meja">
          <span class="meja-dot" />
          Meja {{ seatNumber }}
        </div>
        <button class="btn-ghost" @click="reloadProducts">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M8 16H3v5"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- BODY -->
    <div class="body-grid">

      <!-- LEFT: PRODUCTS -->
      <div class="products-section">

        <!-- FILTER BAR -->
        <div class="filter-bar">
          <div class="search-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              class="search-input"
              placeholder="Cari makanan atau minuman..."
              v-model="searchQuery"
            />
          </div>
          <div class="categories">
            <button
              class="cat-btn"
              :class="{ active: activeCategory === '' }"
              @click="activeCategory = ''"
            >Semua</button>
            <button
              class="cat-btn"
              v-for="c in categories"
              :key="c"
              :class="{ active: activeCategory === c }"
              @click="activeCategory = c"
            >{{ c }}</button>
          </div>
        </div>

        <!-- PRODUCT COUNT -->
        <div class="result-meta" v-if="!loading && !error">
          <span class="count-label">{{ filteredProducts.length }} menu</span>
          <span class="count-sep" v-if="activeCategory">·</span>
          <span class="count-cat" v-if="activeCategory">{{ activeCategory }}</span>
        </div>

        <!-- STATES -->
        <div v-if="loading" class="state-wrap">
          <div class="loader">
            <span /><span /><span />
          </div>
          <p class="state-text">Memuat menu…</p>
        </div>

        <div v-else-if="error" class="state-wrap error">
          <p class="state-text">{{ error }}</p>
          <button class="btn-ghost" @click="reloadProducts">Coba lagi</button>
        </div>

        <!-- GRID -->
        <div v-else class="products-grid">
          <div v-if="filteredProducts.length === 0" class="empty-state">
            Produk tidak ditemukan.
          </div>

          <ProductCard
            v-for="p in filteredProducts"
            :key="p.id"
            :product="p"
            @add="addToCart"
          />
        </div>

      </div>

      <!-- RIGHT: CART -->
      <aside class="cart-sidebar">
        <Cart
          :items="cart"
          :total="total"
          @increase="increaseQty"
          @decrease="decreaseQty"
          @checkout="goCheckout"
        />
      </aside>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/gateway'
import ProductCard from '../../components/customer/ProductCard.vue'
import Cart from '../../components/customer/Cart.vue'

const router = useRouter()
const seatNumber = localStorage.getItem('seatNumber')

const products    = ref([])
const cart        = ref([])
const loading     = ref(false)
const error       = ref('')
const searchQuery = ref('')
const activeCategory = ref('')

const categories = computed(() => {
  const cats = new Set(products.value.map(p => p.category).filter(Boolean))
  return Array.from(cats).sort()
})

const filteredProducts = computed(() =>
  products.value.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCat = activeCategory.value === '' || p.category === activeCategory.value
    return matchSearch && matchCat
  })
)

const loadCart = () => {
  const saved = localStorage.getItem('cart')
  cart.value = saved ? JSON.parse(saved) : []
}

const reloadProducts = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/products/available')
    const list = res?.data?.data
    if (!Array.isArray(list)) throw new Error('Response shape invalid.')
    products.value = list.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category || '',
      is_available: p.is_available,
    }))
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Gagal load produk'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!seatNumber) { router.push('/seat'); return }
  loadCart()
  await reloadProducts()
})

const addToCart = (product) => {
  const item = cart.value.find(i => i.id === product.id)
  if (item) item.qty += 1
  else cart.value.push({ id: product.id, name: product.name, price: product.price, qty: 1 })
}

const increaseQty = (item) => {
  const t = cart.value.find(i => i.id === item.id)
  if (t) t.qty += 1
}

const decreaseQty = (item) => {
  const t = cart.value.find(i => i.id === item.id)
  if (!t) return
  if (t.qty <= 1) cart.value = cart.value.filter(i => i.id !== item.id)
  else t.qty -= 1
}

const total = computed(() =>
  cart.value.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0)
)

watch(cart, val => localStorage.setItem('cart', JSON.stringify(val)), { deep: true })

const goCheckout = () => {
  if (cart.value.length === 0) return
  router.push('/checkout')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

/* ── PAGE SHELL ─────────────────────────────────────── */
.menu-page {
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: var(--bg);
  padding: 28px 28px 48px;
}

/* ── TOPBAR ─────────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-family: 'Playfair Display', serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.03em;
  line-height: 1;
}

.page-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
  font-weight: 300;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.badge-meja {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.04em;
}

.meja-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.btn-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  font-family: inherit;
}

.btn-ghost:hover {
  background: var(--border);
  color: var(--text);
}

/* ── BODY GRID ──────────────────────────────────────── */
.body-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  align-items: flex-start;
}

@media (max-width: 1100px) {
  .body-grid {
    grid-template-columns: 1fr;
  }
}

/* ── PRODUCTS SECTION ───────────────────────────────── */
.products-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: transparent;
  padding: 0;
}

/* ── FILTER BAR ─────────────────────────────────────── */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 11px 16px 11px 38px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 400;
  transition: border-color 0.2s;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
}

.categories {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.categories::-webkit-scrollbar { display: none; }

.cat-btn {
  padding: 5px 15px;
  border-radius: 99px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s;
  font-family: inherit;
}

.cat-btn:hover {
  background: var(--border);
  color: var(--text);
}

.cat-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* ── RESULT META ────────────────────────────────────── */
.result-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 2px;
}

.count-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.count-sep {
  color: var(--border);
  font-size: 11px;
}

.count-cat {
  font-size: 11px;
  color: var(--text);
  font-weight: 600;
  letter-spacing: 0.04em;
}

/* ── STATES ─────────────────────────────────────────── */
.state-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
}

.state-wrap.error .state-text {
  color: var(--danger);
}

.state-text {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 400;
}

.loader {
  display: flex;
  gap: 6px;
  align-items: center;
}

.loader span {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 1.2s ease-in-out infinite;
}

.loader span:nth-child(2) { animation-delay: 0.2s; }
.loader span:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%           { opacity: 1;   transform: scale(1); }
}

/* ── PRODUCTS GRID ──────────────────────────────────── */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px 0;
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
  font-family: 'Playfair Display', serif;
}

/* ── CART SIDEBAR ───────────────────────────────────── */
.cart-sidebar {
  position: sticky;
  top: 84px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 110px);
  box-shadow: var(--shadow);
}
/* hide scrollbar for sleekness */
.cart-sidebar::-webkit-scrollbar {
  display: none;
}
.cart-sidebar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>