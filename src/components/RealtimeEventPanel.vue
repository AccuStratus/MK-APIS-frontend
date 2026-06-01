<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">即時事件</h1>
        <p class="page-subtitle">
          顯示 MQTT / Gateway / PDA / NFC / 線邊庫物流等即時事件，以及 WebSocket 推播紀錄。
        </p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="createEvent">新增 MQTT 事件 Demo</button>
        <button @click="createPush">新增 WebSocket 推播 Demo</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">即時事件</div>
        <div class="metric-value">{{ events.length }}</div>
        <div class="metric-hint">MQTT / Gateway / PDA / NFC</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">推播紀錄</div>
        <div class="metric-value">{{ pushes.length }}</div>
        <div class="metric-hint">WebSocket / Dashboard 推播</div>
      </div>
    </div>

    <div class="card">
      <h2>MQTT / Gateway 即時事件</h2>
      <DataTable :columns="eventColumns" :rows="events" :labels="eventLabels" />
    </div>

    <div class="card">
      <h2>WebSocket 即時推播紀錄</h2>
      <DataTable :columns="pushColumns" :rows="pushes" :labels="pushLabels" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const events = ref([])
const pushes = ref([])

const eventColumns = ['event_id', 'event_time', 'event_source', 'event_type', 'event_level', 'topic', 'process_status']
const eventLabels = {
  event_id: '編號',
  event_time: '時間',
  event_source: '來源',
  event_type: '事件類型',
  event_level: '等級',
  topic: 'Topic',
  process_status: '處理狀態'
}

const pushColumns = ['push_id', 'push_time', 'channel_name', 'target_user', 'message_title', 'message_body', 'push_status']
const pushLabels = {
  push_id: '編號',
  push_time: '時間',
  channel_name: '頻道',
  target_user: '對象',
  message_title: '標題',
  message_body: '內容',
  push_status: '狀態'
}

async function load() {
  events.value = (await apiClient.get('/architecture/events/realtime')).data
  pushes.value = (await apiClient.get('/architecture/events/websocket-push')).data
}

async function createEvent() {
  await apiClient.post('/architecture/events/realtime/demo').catch(showError)
  await load()
}

async function createPush() {
  await apiClient.post('/architecture/events/websocket-push/demo').catch(showError)
  await load()
}

onMounted(load)

function showError(err) {
  const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'API 發生錯誤'
  alert(detail)
  throw err
}
</script>
