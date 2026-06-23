<template>
  <div class="dashboard-page">
    <AdminHeader
      title="Admin Dashboard"
      subtitle="Pantau pesanan dan analytics secara realtime"
      :realtime="realtime"
      @logout="logout"
    />

    <div class="dashboard-grid">
      <StatCard label="Pending Orders" :value="stats.pending" hint="Belum selesai" />
      <StatCard label="Completed Today" :value="stats.completedToday" hint="Selesai hari ini" />
      <StatCard label="Revenue Today" :value="`Rp ${format(stats.revenueToday)}`" hint="Estimasi dari data" />
    </div>

    <div class="dashboard-body">
      <!-- LEFT COLUMN: ORDERS (Scrollable) -->
      <div class="orders-column">
        <div class="panel-pad">
          <div class="row-between">
            <div>
              <div class="h2" style="font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700;">Order Masuk</div>
              <p class="p" style="margin-top: 6px; font-size: 13px; color: var(--text-muted);">Auto refresh + realtime event</p>
            </div>
            <span class="badge" style="background: var(--surface); border: 1px solid var(--border); padding: 4px 10px; border-radius: 99px; font-size: 11px;">Update: {{ lastUpdate }}</span>
          </div>

          <div style="height: 1px; background: var(--border); margin: 20px 0;"></div>

          <div v-if="orders.length === 0" class="p" style="font-style: italic; color: var(--text-muted);">Belum ada order.</div>

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
                  <span>{{ it.qty || it.qty_snapshot || 0 }}x {{ it.name }}</span>
                  <span>Rp {{ format((it.price || it.price_snapshot || 0) * (it.qty || it.qty_snapshot || 0)) }}</span>
                </div>
              </div>

              <div class="row" style="display:flex; justify-content:flex-end; margin-top: 14px;">
                <button
                  class="btn-ghost"
                  :disabled="o.status === 'completed'"
                  @click="completeOrder(o)"
                >
                  Selesaikan Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: ANALYTICS (Fixed / Scrollable on overflow) -->
      <div class="analytics-column">
        <LineChart :points="chartPoints" />
        <div style="height: 20px;"></div>

        <div class="panel-pad">
          <div class="row-between" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="h2" style="font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700;">Analytics</div>
            <span class="badge" style="background: var(--surface); border: 1px solid var(--border); padding: 4px 10px; border-radius: 99px; font-size: 11px;">gRPC via gateway</span>
          </div>

          <div style="height: 1px; background: var(--border); margin: 16px 0;"></div>

          <div class="row-between" style="display: flex; justify-content: space-between; font-size: 14px;">
            <span class="p" style="color: var(--text-muted);">Total Orders</span>
            <strong>{{ analytics.totalOrders }}</strong>
          </div>
          <div class="row-between" style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 12px;">
            <span class="p" style="color: var(--text-muted);">Total Revenue</span>
            <strong>Rp {{ format(analytics.totalRevenue) }}</strong>
          </div>
          <div class="row-between" style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 12px;">
            <span class="p" style="color: var(--text-muted);">Active Seats</span>
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
  const res = await api.get('/analytics/dashboard')
  const data = res?.data?.data || res?.data || {}
  analytics.value = {
    totalOrders: Number(data.totalOrders || data.total_orders || 0),
    totalRevenue: Number(data.totalRevenue || data.total_revenue || 0),
    activeSeats: Number(data.activeSeats || data.active_seats || 0),
  }
}

const completeOrder = async (order) => {
  try {
    await api.post(`/orders/${order.id}/complete`)
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
/* ── DASHBOARD LAYOUT ───────────────────────────────── */
.dashboard-page {
  font-family: 'DM Sans', sans-serif;
  height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 20px;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.dashboard-body {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 900px) {
  .dashboard-page {
    height: auto;
    overflow: auto;
  }
  .dashboard-body {
    grid-template-columns: 1fr;
    overflow: visible;
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.orders-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding-right: 12px;
}
.orders-column::-webkit-scrollbar { display: none; }
.orders-column { -ms-overflow-style: none; scrollbar-width: none; }

.analytics-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}
.analytics-column::-webkit-scrollbar { display: none; }
.analytics-column { -ms-overflow-style: none; scrollbar-width: none; }

.panel-pad {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
}

/* ── ORDERS ─────────────────────────────────────────── */
.orders{ display:flex; flex-direction:column; gap: 12px; }
.order{
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  background: var(--surface);
  transition: transform 0.2s;
}
.order:hover {
  transform: translateY(-2px);
  border-color: var(--text-muted);
}
.ord-title{ font-weight: 700; color: var(--text); font-family: 'Playfair Display', serif; font-size: 16px; }
.ord-sub{ font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.status{
  font-size: 10px;
  font-weight: 800;
  border-radius: 999px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  color: var(--text-muted);
  background: var(--bg);
  letter-spacing: 0.05em;
}
.status.completed{
  border-color: rgba(16, 185, 129, 0.35);
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}
.mini{ margin-top: 12px; display:flex; flex-direction:column; gap: 8px; border-top: 1px dashed var(--border); padding-top: 12px; }
.mini-row{
  display:flex;
  justify-content:space-between;
  font-size: 12px;
  color: var(--text-muted);
}
.btn-ghost{
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  border-radius: 10px;
  padding: 8px 16px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  transition: all 0.2s;
}
.btn-ghost:hover:not(:disabled) {
  background: var(--text);
  color: #fff;
  border-color: var(--text);
}
.btn-ghost:disabled{
  opacity: .4;
  cursor: not-allowed;
}
</style>
