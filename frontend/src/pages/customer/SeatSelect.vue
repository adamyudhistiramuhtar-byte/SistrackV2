<template>
  <div class="center-screen">
    <div class="panel panel-pad" style="max-width: 880px;">
      <div class="row-between">
        <div>
          <h1 class="h1">Pilih Meja</h1>
          <p class="p" style="margin-top: 8px;">Input nomor meja 1 sampai 50 untuk mulai pesan</p>
        </div>
        <span class="kbd">Customer</span>
      </div>

      <div class="divider"></div>

      <div class="two-col">
        <div class="panel" style="background: transparent; box-shadow: none; border: none;">
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

        <div class="sticky">
          <BaseCard>
            <div class="h2">Nomor meja</div>
            <p class="p" style="margin-top: 6px;">Boleh klik grid atau ketik manual</p>

            <div style="margin-top: 12px;">
              <BaseInput
                v-model="seat"
                type="number"
                min="1"
                max="50"
                placeholder="Contoh: 12"
              />
            </div>

            <BaseButton
              style="width: 100%; margin-top: 12px;"
              :disabled="!canStart"
              @click="startOrder"
            >
              Mulai Pesan
            </BaseButton>

            <p v-if="error" class="p" style="color: var(--danger); margin-top: 10px;">
              {{ error }}
            </p>
          </BaseCard>
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
    const res = await api.post('/session/seat', { seatNumber: Number(seat.value) })
    if (res.data && res.data.data && res.data.data.token) {
      localStorage.setItem('sessionToken', res.data.data.token)
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
