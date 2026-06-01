<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">登入 / 權限管理</h1>
        <p class="page-subtitle">對應架構圖中的「登入 / 權限管理」。提供 Demo 登入、使用者清單、登入紀錄。</p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="login">Demo 登入</button>
        <button @click="createUser">新增 Demo 使用者</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="card">
      <h2>登入測試</h2>
      <div class="form-grid">
        <label>帳號<input v-model="form.username" /></label>
        <label>密碼<input v-model="form.password" type="password" /></label>
        <label>登入結果<input :value="loginMessage" readonly /></label>
        <label>Token<input :value="token" readonly /></label>
      </div>
      <div class="form-preview">
        <div><strong>預設帳密：</strong>admin / 123456、operator01 / 123456、planner01 / 123456</div>
        <div><strong>正式版：</strong>可替換為 JWT、SSO、AD、OAuth2 或企業 IAM。</div>
      </div>
    </div>

    <div class="card">
      <h2>使用者 / 角色 / 權限</h2>
      <DataTable :columns="userColumns" :rows="users" :labels="userLabels" />
    </div>

    <div class="card">
      <h2>登入紀錄</h2>
      <DataTable :columns="logColumns" :rows="logs" :labels="logLabels" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const form = ref({ username: 'admin', password: '123456' })
const loginMessage = ref('')
const token = ref('')
const users = ref([])
const logs = ref([])

const userColumns = ['user_id', 'username', 'display_name', 'role_name', 'enabled_flag', 'created_at']
const userLabels = { user_id: '編號', username: '帳號', display_name: '名稱', role_name: '角色', enabled_flag: '啟用', created_at: '建立時間' }

const logColumns = ['login_id', 'login_time', 'username', 'login_status', 'client_ip', 'message']
const logLabels = { login_id: '編號', login_time: '登入時間', username: '帳號', login_status: '狀態', client_ip: '來源 IP', message: '訊息' }

async function login() {
  const res = await apiClient.post('/auth/login', form.value)
  loginMessage.value = res.data.message
  token.value = res.data.token || ''
  await load()
}

async function createUser() {
  await apiClient.post('/auth/users/demo')
  await load()
}

async function load() {
  users.value = (await apiClient.get('/auth/users')).data
  logs.value = (await apiClient.get('/auth/login-logs')).data
}

onMounted(load)
</script>
