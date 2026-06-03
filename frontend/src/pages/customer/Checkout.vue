<template>
  <div class="page full">
    <div class="shell">

      <!-- TOP BAR -->
      <div class="topbar">
        <div>
          <h1 class="h1">Checkout</h1>
          <p class="p-muted">Konfirmasi pesanan sebelum dikirim</p>
        </div>

        <div class="row" style="flex:0; gap:10px;">
          <div class="badge">Meja {{ seatNumber }}</div>
          <button class="btn" @click="backToMenu">Kembali</button>
        </div>
      </div>

      <div style="height:16px;"></div>

      <!-- MAIN GRID -->
      <div class="grid checkout-grid">

        <!-- LEFT : ORDER SUMMARY -->
        <div class="panel">
          <div class="panel-inner">
            <div class="h2" style="font-weight:900; margin-bottom:12px;">
              Ringkasan Pesanan
            </div>

            <div v-if="cart.length === 0" class="p-muted" style="padding:16px 0;">
              Cart kosong. Silakan kembali ke menu.
            </div>

            <div v-else class="summary">
              <div
                class="cart-item"
                v-for="item in cart"
                :key="item.id"
              >
                <div>
                  <div class="item-name">{{ item.name }}</div>
                  <div class="item-sub">Qty {{ item.qty }}</div>
                </div>

                <div class="item-price">
                  Rp {{ formatPrice(item.price * item.qty) }}
                </div>
              </div>

              <div class="divider"></div>

              <div class="total-row">
                <span>Total</span>
                <strong>Rp {{ formatPrice(total) }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT : CUSTOMER INFO -->
        <div class="panel">
          <div class="panel-inner">
            <div class="h2" style="font-weight:900; margin-bottom:12px;">
              Data Pemesan
            </div>

            <BaseInput
              v-model="customerName"
              placeholder="Nama pelanggan"
            />

            <div style="height:10px;"></div>

            <BaseInput
              v-model="phone"
              placeholder="Nomor HP (opsional)"
            />

            <div style="height:10px;"></div>

            <BaseSelect v-model="paymentMethod">
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
            </BaseSelect>

            <div style="height:14px;"></div>

            <BaseButton
              primary
              style="width:100%;"
              :disabled="loading || !customerName || cart.length === 0"
              @click="submitOrder"
            >
              {{ loading ? 'Mengirim...' : 'Kirim Pesanan' }}
            </BaseButton>

            <p v-if="err" class="err">
              {{ err }}
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/gateway'

import BaseInput from '../../components/common/BaseInput.vue'
import BaseSelect from '../../components/common/BaseSelect.vue'
import BaseButton from '../../components/common/BaseButton.vue'

const router = useRouter()

const cart = ref([])
const customerName = ref('')
const phone = ref('')
const paymentMethod = ref('cash')
const loading = ref(false)
const err = ref('')

const seatNumber = localStorage.getItem('seatNumber')

onMounted(() => {
  const savedCart = localStorage.getItem('cart')

  if (!seatNumber || !savedCart) {
    router.push('/seat')
    return
  }

  cart.value = JSON.parse(savedCart).map(i => ({
    ...i,
    price: Number(i.price),
    qty: Number(i.qty),
  }))

  if (!Array.isArray(cart.value) || cart.value.length === 0) {
    router.push('/menu')
  }
})

const total = computed(() =>
  cart.value.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0)
)

const backToMenu = () => router.push('/menu')

const submitOrder = async () => {
  err.value = ''
  if (!customerName.value) {
    err.value = 'Nama pelanggan wajib diisi'
    return
  }

  loading.value = true

  try {
    await api.post('/orders', {
      seatNumber: Number(seatNumber),
      customerName: customerName.value,
      phone: phone.value,
      paymentMethod: paymentMethod.value,
      items: cart.value.map(i => ({
        product_id: i.id,
        name: i.name,
        price: Number(i.price),
        qty: Number(i.qty),
      })),
    }, {
      headers: {
        'x-session-token': localStorage.getItem('sessionToken') || ''
      }
    })

    localStorage.removeItem('cart')
    localStorage.removeItem('seatNumber')
    localStorage.removeItem('sessionToken')
    router.push('/seat')
  } catch (e) {
    err.value = e?.response?.data?.message || 'Gagal mengirim pesanan'
  } finally {
    loading.value = false
  }
}

const formatPrice = n =>
  new Intl.NumberFormat('id-ID').format(Number(n) || 0)
</script>

<style scoped>
.checkout-grid{
  grid-template-columns: 1.2fr 0.8fr;
}
@media (max-width: 1000px){
  .checkout-grid{
    grid-template-columns: 1fr;
  }
}

.summary{
  display:flex;
  flex-direction:column;
}

.item-name{
  font-weight:800;
}
.item-sub{
  font-size:12px;
  color: var(--muted);
}

.item-price{
  font-weight:900;
}

.total-row{
  display:flex;
  justify-content:space-between;
  font-size:16px;
  font-weight:900;
}
</style>

<style scoped>
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 10px;
}
</style>

