<template>
  <div class="page full">
    <div class="shell">

      <!-- TOP BAR -->
      <div class="topbar">
        <div>
          <h1 class="h1">Menu</h1>
          <p class="p-muted">Pilih menu dan masukin ke cart</p>
        </div>

        <div class="row" style="flex:0; gap:10px;">
          <div class="badge">Meja {{ seatNumber }}</div>
          <button class="btn" @click="reloadProducts">Refresh</button>
        </div>
      </div>

      <div style="height:16px;"></div>

      <!-- MAIN GRID -->
      <div class="menu-grid">

        <!-- PRODUCTS -->
        <div class="panel">
          <div class="panel-inner">

            <div v-if="loading" class="state muted">
              Loading produk…
            </div>

            <div v-else-if="error" class="state error">
              {{ error }}
            </div>

            <div v-else class="products-grid">
              <div
                v-if="products.length === 0"
                class="state muted full-span"
              >
                Produk belum tersedia atau availability masih salah.
              </div>

              <ProductCard
                v-for="p in products"
                :key="p.id"
                :product="p"
                @add="addToCart"
              />
            </div>

          </div>
        </div>

        <!-- CART -->
        <div class="panel cart-panel">
          <div class="panel-inner">
            <Cart
              :items="cart"
              :total="total"
              @increase="increaseQty"
              @decrease="decreaseQty"
              @checkout="goCheckout"
            />
          </div>
        </div>

      </div>
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

const products = ref([])
const cart = ref([])
const loading = ref(false)
const error = ref('')

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

    if (!Array.isArray(list)) {
      throw new Error('Response shape invalid. Pastikan backend return { data: [] }')
    }

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
  if (!seatNumber) {
    router.push('/seat')
    return
  }

  loadCart()
  await reloadProducts()
})

const addToCart = (product) => {
  const item = cart.value.find(i => i.id === product.id)
  if (item) item.qty += 1
  else cart.value.push({
    id: product.id,
    name: product.name,
    price: product.price,
    qty: 1,
  })
}

const increaseQty = (item) => {
  const t = cart.value.find(i => i.id === item.id)
  if (t) t.qty += 1
}

const decreaseQty = (item) => {
  const t = cart.value.find(i => i.id === item.id)
  if (!t) return
  if (t.qty <= 1) {
    cart.value = cart.value.filter(i => i.id !== item.id)
  } else {
    t.qty -= 1
  }
}

const total = computed(() =>
  cart.value.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0)
)

watch(
  cart,
  (val) => localStorage.setItem('cart', JSON.stringify(val)),
  { deep: true }
)

const goCheckout = () => {
  if (cart.value.length === 0) return
  router.push('/checkout')
}
</script>

<style scoped>
.menu-grid{
  display:grid;
  grid-template-columns: 1fr 420px;
  gap:16px;
}
@media (max-width: 1100px){
  .menu-grid{
    grid-template-columns: 1fr;
  }
}

.products-grid{
  display:grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap:14px;
}
@media (max-width: 1200px){
  .products-grid{
    grid-template-columns: repeat(2, minmax(0,1fr));
  }
}
@media (max-width: 640px){
  .products-grid{
    grid-template-columns: 1fr;
  }
}

.cart-panel{
  position:sticky;
  top:24px;
}

.state{
  padding:40px 10px;
  text-align:center;
  font-weight:600;
}
.state.muted{
  color: var(--muted);
}
.state.error{
  color:#ff4d4d;
}
.full-span{
  grid-column: 1 / -1;
}
</style>
