<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">AIPS</div>
      <h1>MK-AIPS 智慧排程模組</h1>
      <p>請先登入後再進入系統。</p>

      <div class="login-form">
        <label>
          帳號
          <input v-model="form.username" @keyup.enter="login" />
        </label>

        <label>
          密碼
          <input v-model="form.password" type="password" @keyup.enter="login" />
        </label>

        <button class="primary-btn login-btn" @click="login" :disabled="loading">
          {{ loading ? '登入中...' : '登入' }}
        </button>

        <button class="demo-btn" @click="fillAdmin">
          使用 Demo 帳密 admin / 123456
        </button>

        <div v-if="message" class="login-message" :class="{ error: !success }">
          {{ message }}
        </div>
      </div>

      <div class="login-hint">
        <strong>Demo 帳密：</strong>
        admin / 123456、operator01 / 123456、planner01 / 123456
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import apiClient from '../api/apiClient'

const emit = defineEmits(['login-success'])

const form = ref({
  username: 'admin',
  password: '123456'
})

const loading = ref(false)
const message = ref('')
const success = ref(false)

function fillAdmin() {
  form.value.username = 'admin'
  form.value.password = '123456'
}

async function login() {
  loading.value = true
  message.value = ''
  success.value = false

  try {
    await apiClient.post('/hardware-simulator/init').catch(() => {})
    const res = await apiClient.post('/auth/login', form.value)

    if (!res.data.success) {
      message.value = res.data.message || '登入失敗'
      return
    }

    success.value = true
    message.value = '登入成功'
    emit('login-success', {
      token: res.data.token,
      user: res.data.user
    })
  } catch (err) {
    message.value = err?.response?.data?.detail || err?.response?.data?.message || `${err?.message || '登入 API 發生錯誤'}，目前 API：${window.location.protocol}//${window.location.hostname}:8000/api，請確認後端與防火牆`
  } finally {
    loading.value = false
  }
}
</script>
