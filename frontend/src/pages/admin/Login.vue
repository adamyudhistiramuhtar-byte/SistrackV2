<template>
  <div class="center-screen">
    <div class="panel panel-pad" style="max-width: 520px;">
      <div class="row-between">
        <div>
          <h1 class="h1">Admin Login</h1>
          <p class="p" style="margin-top: 8px;">Masuk untuk kelola pesanan dan laporan</p>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
          <span class="kbd">Admin</span>
          <router-link to="/seat" class="customer-link">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Kembali ke Seat
          </router-link>
        </div>
      </div>

      <div class="divider"></div>

      <BaseCard>
      <BaseInput id="email" name="email" v-model="email" placeholder="Email" autocomplete="email" />
      <div style="height: 10px;"></div>
      <BaseInput id="password" name="password" v-model="password" type="password" placeholder="Password" autocomplete="current-password" />

        <BaseButton
          style="width: 100%; margin-top: 12px;"
          :disabled="loading || !email || !password"
          @click="login"
        >
          {{ loading ? 'Login…' : 'Login' }}
        </BaseButton>

        <p v-if="error" class="p" style="color: var(--danger); margin-top: 10px;">
          {{ error }}
        </p>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/gateway'

const router = useRouter()
const email = ref('admin@sistrackv2.local')
const password = ref('Admin123!')
const loading = ref(false)
const error = ref('')

const login = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await api.post('/auth/login', {
      email: email.value,
      password: password.value,
    })

    const token =
      res?.data?.token ||
      res?.data?.data?.token ||
      res?.data?.accessToken ||
      res?.data?.data?.accessToken

    if (!token) {
      error.value = 'Login berhasil tapi token tidak ditemukan. Cek response auth-service.'
      return
    }

    localStorage.setItem('adminToken', token)
    router.push('/admin/dashboard')
  } catch (e) {
    error.value = 'Email atau password salah, atau gateway belum nyambung.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.customer-link {
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}
.customer-link:hover {
  color: var(--text);
}
</style>
