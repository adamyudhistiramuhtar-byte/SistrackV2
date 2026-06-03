<template>
  <div class="checkout-page">

    <!-- TOPBAR -->
    <div class="topbar">
      <button class="btn-back" @click="backToMenu">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
        </svg>
        Kembali
      </button>
      <div class="badge-meja">Meja {{ seatNumber }}</div>
    </div>

    <!-- RECEIPT CARD -->
    <div class="receipt-shell">

      <!-- RECEIPT HEADER -->
      <div class="receipt-header">
        <div class="receipt-ornament">
          <span class="orn-line" /><span class="orn-diamond" /><span class="orn-line" />
        </div>
        <h1 class="receipt-title">Konfirmasi Pesanan</h1>
        <p class="receipt-sub">Periksa pesanan Anda sebelum dikirim ke dapur</p>
        <div class="receipt-ornament">
          <span class="orn-line" /><span class="orn-diamond" /><span class="orn-line" />
        </div>
      </div>

      <!-- MAIN BODY -->
      <div class="receipt-body">

        <!-- ORDER SUMMARY (LEFT) -->
        <div class="summary-col">
          <div class="col-label">Ringkasan Pesanan</div>

          <div v-if="cart.length === 0" class="empty-cart">
            <span>Cart kosong.</span>
            <button class="link-btn" @click="backToMenu">Kembali ke menu</button>
          </div>

          <div v-else class="order-list">
            <div
              class="order-row"
              v-for="(item, idx) in cart"
              :key="item.id"
              :style="{ animationDelay: `${idx * 60}ms` }"
            >
              <div class="order-left">
                <span class="order-qty">{{ item.qty }}×</span>
                <div>
                  <div class="order-name">{{ item.name }}</div>
                  <div class="order-unit">@ Rp {{ formatPrice(item.price) }}</div>
                </div>
              </div>
              <div class="order-price">Rp {{ formatPrice(item.price * item.qty) }}</div>
            </div>

            <div class="summary-divider">
              <span class="dash-line" />
            </div>

            <div class="total-row">
              <span class="total-label">Total</span>
              <span class="total-amount">Rp {{ formatPrice(total) }}</span>
            </div>
          </div>
        </div>

        <!-- VERTICAL DIVIDER -->
        <div class="col-divider" />

        <!-- CUSTOMER FORM (RIGHT) -->
        <div class="form-col">
          <div class="col-label">Data Pemesan</div>

          <div class="form-group">
            <label class="field-label">Nama Pelanggan <span class="req">*</span></label>
            <input
              v-model="customerName"
              type="text"
              class="field-input"
              :class="{ 'field-error': showNameError }"
              placeholder="Nama lengkap"
              @input="showNameError = false"
            />
            <span v-if="showNameError" class="field-hint error">Nama wajib diisi</span>
          </div>

          <div class="form-group">
            <label class="field-label">Nomor HP <span class="optional">opsional</span></label>
            <input
              v-model="phone"
              type="text"
              class="field-input"
              placeholder="08xx-xxxx-xxxx"
            />
          </div>

          <div class="form-group">
            <label class="field-label">Metode Pembayaran</label>
            <div class="payment-options">
              <button
                class="pay-opt"
                :class="{ selected: paymentMethod === 'cash' }"
                @click="paymentMethod = 'cash'"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <path d="M6 12h.01M18 12h.01"/>
                </svg>
                Cash
              </button>
              <button
                class="pay-opt"
                :class="{ selected: paymentMethod === 'transfer' }"
                @click="paymentMethod = 'transfer'"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
                Transfer
              </button>
            </div>
          </div>

          <p v-if="err" class="form-err">{{ err }}</p>

          <button
            class="submit-btn"
            :class="{ loading: loading }"
            :disabled="loading || cart.length === 0"
            @click="submitOrder"
          >
            <span v-if="!loading">
              Kirim Pesanan
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9l20-7z"/>
              </svg>
            </span>
            <span v-else class="sending">
              <span class="send-dot"/><span class="send-dot"/><span class="send-dot"/>
            </span>
          </button>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/gateway'

const router = useRouter()

const cart          = ref([])
const customerName  = ref('')
const phone         = ref('')
const paymentMethod = ref('cash')
const loading       = ref(false)
const err           = ref('')
const showNameError = ref(false)

const seatNumber = localStorage.getItem('seatNumber')

onMounted(() => {
  const savedCart = localStorage.getItem('cart')
  if (!seatNumber || !savedCart) { router.push('/seat'); return }

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
  if (!customerName.value.trim()) {
    showNameError.value = true
    return
  }

  loading.value = true
  try {
    await api.post('/orders', {
      seatNumber: Number(seatNumber),
      customerName: customerName.value.trim(),
      phone: phone.value,
      paymentMethod: paymentMethod.value,
      items: cart.value.map(i => ({
        product_id: i.id,
        name: i.name,
        price: Number(i.price),
        qty: Number(i.qty),
      })),
    }, {
      headers: { 'x-session-token': localStorage.getItem('sessionToken') || '' }
    })

    localStorage.removeItem('cart')
    localStorage.removeItem('seatNumber')
    localStorage.removeItem('sessionToken')
    router.push('/seat')
  } catch (e) {
    err.value = e?.response?.data?.message || 'Gagal mengirim pesanan. Coba lagi.'
  } finally {
    loading.value = false
  }
}

const formatPrice = n =>
  new Intl.NumberFormat('id-ID').format(Number(n) || 0)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

/* ── PAGE ───────────────────────────────────────────── */
.checkout-page {
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: var(--bg);
  padding: 28px 28px 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── TOPBAR ─────────────────────────────────────────── */
.topbar {
  width: 100%;
  max-width: 900px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 99px;
  padding: 7px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.18s;
  font-family: inherit;
}

.btn-back:hover {
  border-color: var(--text);
  color: var(--text);
}

.badge-meja {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.05em;
}

/* ── RECEIPT SHELL ──────────────────────────────────── */
.receipt-shell {
  width: 100%;
  max-width: 900px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(0,0,0,0.05);
  animation: receiptIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
}

@keyframes receiptIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── RECEIPT HEADER ─────────────────────────────────── */
.receipt-header {
  padding: 36px 40px 28px;
  text-align: center;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.receipt-ornament {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 120px;
}

.orn-line {
  flex: 1;
  height: 1px;
  background: var(--border);
}

.orn-diamond {
  width: 5px;
  height: 5px;
  background: var(--text-muted);
  transform: rotate(45deg);
  flex-shrink: 0;
}

.receipt-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
}

.receipt-sub {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 300;
  letter-spacing: 0.04em;
  font-style: italic;
  font-family: 'Playfair Display', serif;
}

/* ── RECEIPT BODY ───────────────────────────────────── */
.receipt-body {
  display: grid;
  grid-template-columns: 1.1fr auto 0.9fr;
  padding: 36px 40px;
  gap: 0;
}

@media (max-width: 720px) {
  .receipt-body {
    grid-template-columns: 1fr;
    padding: 24px;
  }
  .col-divider { display: none; }
}

/* ── COLUMN LABELS ──────────────────────────────────── */
.col-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 20px;
}

/* ── ORDER LIST ─────────────────────────────────────── */
.summary-col {
  padding-right: 32px;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 32px 0;
}

.empty-cart span {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
}

.link-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: var(--text);
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;
  padding: 0;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.order-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  animation: rowIn 0.3s ease forwards;
  opacity: 0;
  transform: translateX(-8px);
}

@keyframes rowIn {
  to { opacity: 1; transform: translateX(0); }
}

.order-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.order-qty {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  min-width: 28px;
  line-height: 1.3;
}

.order-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.3;
}

.order-unit {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  font-weight: 300;
}

.order-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  padding-left: 16px;
}

.summary-divider {
  padding: 16px 0 12px;
}

.dash-line {
  display: block;
  height: 1px;
  background: repeating-linear-gradient(
    90deg,
    rgba(22, 20, 15, 0.15) 0,
    rgba(22, 20, 15, 0.15) 6px,
    transparent 6px,
    transparent 12px
  );
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 4px;
}

.total-label {
  font-family: 'Playfair Display', serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.total-amount {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}

/* ── DIVIDER ────────────────────────────────────────── */
.col-divider {
  width: 1px;
  background: repeating-linear-gradient(
    180deg,
    rgba(22, 20, 15, 0.1) 0,
    rgba(22, 20, 15, 0.1) 6px,
    transparent 6px,
    transparent 12px
  );
  margin: 0 32px;
}

/* ── FORM ───────────────────────────────────────────── */
.form-col {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.req {
  color: var(--danger);
}

.optional {
  font-size: 10px;
  font-weight: 400;
  color: var(--text-muted);
  text-transform: none;
  letter-spacing: 0;
  margin-left: 4px;
  font-style: italic;
}

.field-input {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 13px;
  font-weight: 400;
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  transition: border-color 0.2s;
}

.field-input::placeholder { color: var(--text-muted); }

.field-input:focus {
  outline: none;
  border-color: var(--accent);
}

.field-input.field-error {
  border-color: var(--danger);
}

.field-hint.error {
  font-size: 11px;
  color: var(--danger);
  font-weight: 400;
}

/* ── PAYMENT OPTIONS ────────────────────────────────── */
.payment-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.pay-opt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 11px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.18s;
  font-family: inherit;
}

.pay-opt:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.pay-opt.selected {
  background: var(--border);
  border-color: var(--text);
  color: var(--text);
}

/* ── SUBMIT ─────────────────────────────────────────── */
.form-err {
  font-size: 12px;
  color: var(--danger);
  padding: 10px 14px;
  background: rgba(220,80,60,0.08);
  border: 1px solid rgba(220,80,60,0.18);
  border-radius: 8px;
  margin: 0;
}

.submit-btn {
  margin-top: auto;
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  background: var(--accent);
  border: none;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'DM Sans', sans-serif;
  letter-spacing: 0.02em;
  transition: opacity 0.2s, transform 0.15s;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.submit-btn span {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* loading dots inside submit */
.sending {
  display: flex;
  gap: 5px;
  align-items: center;
}

.send-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  animation: pulse 1.2s ease-in-out infinite;
}

.send-dot:nth-child(2) { animation-delay: 0.2s; }
.send-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40%           { opacity: 1;   transform: scale(1); }
}
</style>