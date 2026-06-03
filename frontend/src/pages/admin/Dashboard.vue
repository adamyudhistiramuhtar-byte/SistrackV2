<template>
  <div class="container">
    <AdminHeader
      title="Admin Dashboard"
      subtitle="Pantau pesanan dan analytics secara realtime"
      :realtime="realtime"
      @logout="logout"
    />

    <div class="grid" style="grid-template-columns: repeat(3, minmax(0,1fr));">
      <StatCard label="Pending Orders" :value="stats.pending" hint="Belum selesai" />
      <StatCard label="Completed Today" :value="stats.completedToday" hint="Selesai hari ini" />
      <StatCard label="Revenue Today" :value="`Rp ${format(stats.revenueToday)}`" hint="Estimasi dari data" />
    </div>

    <div class="divider"></div>

    <div class="two-col">
      <div class="panel panel-pad">
        <div class="row-between">
          <div>
            <div class="h2">Order Masuk</div>
            <p class="p" style="margin-top: 6px;">Auto refresh + realtime event</p>
          </div>
          <span class="badge">Update: {{ lastUpdate }}</span>
        </div>

        <div class="divider"></div>

        <div v-if="orders.length === 0" class="p">Belum ada order.</div>

        <div v-else class="orders">
          <div v-for="o in orders" :key="o.id" class="order">
            <div class="row-between">
              <div>
                <div class="ord-title">Meja {{ o.seatNumber }} · {{ o.customerName || 'Customer' }}</div>
                <div class="ord-sub">
                  {{ (o.items ? o.items.reduce((s, it) => s + Number(it.qty || 0), 0) : 0) }} item · Rp {{ format(o.total || 0) }}
                </div>
              </div>

              <span class="status" :class="o.status">
                {{ (o.status || 'pending').toUpperCase() }}
              </span>
            </div>

            <div class="mini">
              <div v-for="(it, idx) in (o.items || [])" :key="it.id || it.product_id || idx" class="mini-row">
                <span>Rp {{ format((it.price || it.price_snapshot || 0) * (it.qty || it.qty_snapshot || 0)) }}</span>
              </div>
            </div>

            <div class="row" style="justify-content:flex-end; margin-top: 10px;">
              <button
                class="btn-ghost"
                :disabled="o.status === 'completed'"
                @click="completeOrder(o)"
              >
                Selesaikan
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="sticky">
        <LineChart :points="chartPoints" />
        <div style="height: 12px;"></div>

        <div class="panel panel-pad">
          <div class="row-between">
            <div class="h2">Analytics</div>
            <span class="badge">gRPC via gateway</span>
          </div>

          <div class="divider"></div>

          <div class="row-between">
            <span class="p">Total Orders</span>
            <strong>{{ analytics.totalOrders }}</strong>
          </div>
          <div class="row-between" style="margin-top: 10px;">
            <span class="p">Total Revenue</span>
            <strong>Rp {{ format(analytics.totalRevenue) }}</strong>
          </div>
          <div class="row-between" style="margin-top: 10px;">
            <span class="p">Active Seats</span>
            <strong>{{ analytics.activeSeats }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div v-if="toast.show" class="toast" :class="toast.type">
      <strong>{{ toast.title }}</strong>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from '../../api/gateway'
import { io } from 'socket.io-client'

import AdminHeader from '../../components/admin/AdminHeader.vue'
import StatCard from '../../components/admin/StatCard.vue'
import LineChart from '../../components/admin/LineChart.vue'

const orders = ref([])
const realtime = ref(false)
const lastUpdate = ref('')

const stats = ref({
  pending: 0,
  completedToday: 0,
  revenueToday: 0,
})

const analytics = ref({
  totalOrders: 0,
  totalRevenue: 0,
  activeSeats: 0,
})

const chartPoints = ref([])

const toast = ref({ show: false, type: 'ok', title: '', message: '' })
const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
  setTimeout(() => (toast.value.show = false), 2200)
}

const format = (n) => new Intl.NumberFormat('id-ID').format(Number(n || 0))
const nowLabel = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

const calcStats = () => {
  const pending = orders.value.filter(o => (o.status || 'pending') !== 'completed').length
  const completedToday = orders.value.filter(o => (o.status || '') === 'completed').length
  const revenueToday = orders.value.reduce((s, o) => s + Number(o.total || 0), 0)
  stats.value = { pending, completedToday, revenueToday }
}

const rebuildChart = () => {
  // chartPoints dari analytics atau dari orders
  // disini kita bikin trend sederhana: akumulasi revenue per urutan order
  let acc = 0
  chartPoints.value = orders.value.map((o, idx) => {
    acc += Number(o.total || 0)
    return { x: idx + 1, y: acc }
  })
}

const fetchOrders = async () => {
  // fetch orders through gateway base (`/api` is already part of `api` instance)
  const res = await api.get('/orders')
  orders.value = Array.isArray(res.data) ? res.data : (res.data?.data || [])
  lastUpdate.value = nowLabel()
  calcStats()
  rebuildChart()
}

const fetchAnalytics = async () => {
  const res = await api.get('/api/analytics/dashboard')
  const data = res?.data?.data || res?.data || {}
  analytics.value = {
    totalOrders: Number(data.totalOrders || data.total_orders || 0),
    totalRevenue: Number(data.totalRevenue || data.total_revenue || 0),
    activeSeats: Number(data.activeSeats || data.active_seats || 0),
  }
}

const completeOrder = async (order) => {
  try {
    await api.post(`/api/orders/${order.id}/complete`)
    showToast('ok', 'Selesai', `Order meja ${order.seatNumber} selesai`)
    await fetchOrders()
    await fetchAnalytics()
  } catch (e) {
    showToast('err', 'Gagal', 'Tidak bisa menyelesaikan order. Cek backend.')
  }
}

const logout = () => {
  localStorage.removeItem('adminToken')
  location.href = '/admin/login'
}

let timer = null
let socket = null

onMounted(async () => {
  await fetchOrders()
  await fetchAnalytics()

  timer = setInterval(async () => {
    await fetchOrders()
    await fetchAnalytics()
  }, 5000)

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3004'
  socket = io(`${socketUrl}/admin`, { transports: ['websocket'] })

  socket.on('connect', () => {
    realtime.value = true
    showToast('ok', 'Terhubung', 'Realtime admin aktif')
  })

  socket.on('disconnect', () => {
    realtime.value = false
    showToast('err', 'Terputus', 'Realtime admin mati, fallback auto refresh')
  })

  socket.on('order_created', async () => {
    await fetchOrders()
    await fetchAnalytics()
  })

  socket.on('order_completed', async () => {
    await fetchOrders()
    await fetchAnalytics()
  })

  socket.on('analytics_updated', async () => {
    await fetchAnalytics()
  })
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  if (socket) socket.disconnect()
})
</script>

<style scoped>
.orders{ display:flex; flex-direction:column; gap: 12px; }
.order{
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  background: rgba(255,255,255,.03);
}
.ord-title{ font-weight: 900; }
.ord-sub{ font-size: 12px; color: var(--muted); margin-top: 4px; }
.status{
  font-size: 12px;
  font-weight: 900;
  border-radius: 999px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  color: var(--muted);
}
.status.completed{
  border-color: rgba(52,211,153,.35);
  color: rgba(52,211,153,.95);
}
.mini{ margin-top: 10px; display:flex; flex-direction:column; gap: 6px; }
.mini-row{
  display:flex;
  justify-content:space-between;
  font-size: 12px;
  color: var(--muted);
}
.btn-ghost{
  border: 1px solid var(--border);
  background: #0f0f10;
  color: var(--text);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 900;
  cursor: pointer;
}
.btn-ghost:disabled{
  opacity: .55;
  cursor: not-allowed;
}
</style>
