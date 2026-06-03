<template>
  <div class="seat-page">
    <div class="seat-shell">
      <div class="row-between" style="margin-bottom: 32px;">
        <div>
          <h1 class="page-title">Pilih Meja</h1>
          <p class="page-sub">Pilih nomor meja untuk mulai memesan</p>
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
    const res = await api.get('/orders')
    const orders = res?.data?.data || res?.data || []
    const s = new Set()
    orders.forEach((o) => {
      if (o && o.status && o.status !== 'completed') {
        const n = Number(o.seatNumber)
        if (!Number.isNaN(n)) s.add(n)
      }
    })

    try {
      const r2 = await api.get('/orders/seats')
      const seats = r2?.data?.data || r2?.data || []
      seats.forEach((srow) => {
        if (srow && srow.status && srow.status !== 'available') {
          const n = Number(srow.seatNumber)
          if (!Number.isNaN(n)) s.add(n)
        }
      })
    } catch (e2) {}

    taken.value = s
  } catch (e) {}
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
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
.seat-page {
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: #0D0B09;
  padding: 48px 28px;
  display: flex;
  justify-content: center;
}
.seat-shell {
  width: 100%;
  max-width: 900px;
}
.row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-title {
  font-family: 'Playfair Display', serif;
  font-size: 32px;
  font-weight: 700;
  color: #f0d9b0;
  margin: 0;
}
.page-sub {
  font-size: 13px;
  color: rgba(240, 217, 176, 0.35);
  margin-top: 4px;
}
.body-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  align-items: flex-start;
}
@media (max-width: 900px) {
  .body-grid { grid-template-columns: 1fr; }
}
.sticky-panel {
  position: sticky;
  top: 24px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.055);
  border-radius: 18px;
  padding: 24px;
}
.field-input {
  width: 100%;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 14px;
  color: #f0d9b0;
  font-family: 'DM Sans', sans-serif;
}
.field-input:focus {
  outline: none;
  border-color: rgba(200,135,42,0.45);
}
.submit-btn {
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #b8721e, #d4943a);
  border: none;
  font-size: 14px;
  font-weight: 700;
  color: #1a1108;
  cursor: pointer;
  transition: opacity 0.2s;
  font-family: 'DM Sans', sans-serif;
}
.submit-btn:hover:not(:disabled) {
  opacity: 0.92;
}
.submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.badge-meja {
  background: rgba(200, 135, 42, 0.10);
  border: 1px solid rgba(200, 135, 42, 0.25);
  border-radius: 10px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #d4a050;
}
.admin-link {
  font-size: 12px;
  color: rgba(240,217,176,0.3);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}
.admin-link:hover {
  color: #f0d9b0;
}
.grid-seat {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
}
</style>
