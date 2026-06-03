<template>
  <div class="seat-page">
    <div class="seat-shell">
      <div class="row-between" style="margin-bottom: 32px;">
        <div>
          <h1 class="page-title">Pilih Meja</h1>
          <p class="page-sub">Input nomor meja 1 sampai 50 untuk mulai pesan</p>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
          <span class="badge-meja" style="padding: 4px 10px; font-size: 10px;">Customer</span>
          <router-link to="/admin/login" class="admin-link">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Admin Login
          </router-link>
        </div>
      </div>

      <div class="body-grid">
        <div style="background: transparent; box-shadow: none; border: none;">
          <div class="grid grid-seat">
            <SeatCard
              v-for="n in seatsList"
              :key="n"
              :number="n"
              :active="Number(seat) === n"
              @pick="pickSeat"
            />
          </div>
        </div>

        <div class="sticky-panel">
          <div style="font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #f0d9b0;">Nomor meja</div>
          <p style="margin-top: 6px; font-size: 13px; color: rgba(240,217,176,0.3);">Boleh klik grid atau ketik manual</p>

          <div style="margin-top: 16px;">
            <input
              v-model="seat"
              type="number"
              min="1"
              max="50"
              placeholder="Contoh: 12"
              class="field-input"
            />
          </div>

          <button
            class="submit-btn"
            style="width: 100%; margin-top: 16px;"
            :disabled="!canStart"
            @click="startOrder"
          >
            Mulai Pesan
          </button>

          <p v-if="error" style="color: #e07060; margin-top: 10px; font-size: 12px;">
            {{ error }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import SeatCard from '../../components/customer/SeatCard.vue'
import api from '../../api/gateway'

const router = useRouter()
const seat = ref('')
const error = ref('')

const taken = ref(new Set())
let pollId = null

const seatsList = computed(() => {
  const out = []
  for (let i = 1; i <= 50; i++) {
    if (!taken.value.has(i)) out.push(i)
  }
  return out
})

const refreshTaken = async () => {
  try {
    // fetch active orders
    const res = await api.get('/orders')
    const orders = res?.data?.data || res?.data || []
    const s = new Set()
    orders.forEach((o) => {
      if (o && o.status && o.status !== 'completed') {
        const n = Number(o.seatNumber)
        if (!Number.isNaN(n)) s.add(n)
      }
    })

    // also fetch seats table to detect locked seats
    try {
      // gateway exposes order-service seats at /api/orders/seats -> use '/orders/seats' here
      const r2 = await api.get('/orders/seats')
      const seats = r2?.data?.data || r2?.data || []
      seats.forEach((srow) => {
        if (srow && srow.status && srow.status !== 'available') {
          const n = Number(srow.seatNumber)
          if (!Number.isNaN(n)) s.add(n)
        }
      })
    } catch (e2) {
      // ignore seat endpoint errors
    }

    taken.value = s
  } catch (e) {
    // ignore errors for now
  }
}

onMounted(() => {
  refreshTaken()
  pollId = setInterval(refreshTaken, 5000)
})
onUnmounted(() => {
  if (pollId) clearInterval(pollId)
})

const canStart = computed(() => {
  const n = Number(seat.value)
  return Number.isInteger(n) && n >= 1 && n <= 50 && !taken.value.has(n)
})

const pickSeat = (n) => {
  // ignore picks for taken seats
  if (taken.value.has(n)) return
  seat.value = String(n)
  error.value = ''
}

const startOrder = async () => {
  if (!canStart.value) {
    error.value = taken.value.has(Number(seat.value)) ? 'Meja sudah terpakai' : 'Nomor meja harus 1 sampai 50'
    return
  }

  try {
    const res = await api.post('/session/seat', { seat_number: Number(seat.value) })
    if (res.data && res.data.token) {
      localStorage.setItem('sessionToken', res.data.token)
    }
  } catch (err) {
    error.value = err?.response?.data?.message || 'Gagal memulai sesi meja'
    return
  }

  localStorage.setItem('seatNumber', String(Number(seat.value)))
  localStorage.removeItem('cart')
  router.push('/menu')
}
</script>

<style scoped>
.admin-link {
  font-size: 12px;
  color: var(--muted);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}
.admin-link:hover {
  color: white;
}
</style>

