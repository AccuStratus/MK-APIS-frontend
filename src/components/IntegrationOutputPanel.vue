<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">對外整合輸出</h1>
        <p class="page-subtitle">
          顯示 MES / ERP / WMS 整合紀錄、Email / LINE / Teams 通知，以及 Excel / PDF / BI 報表輸出。
        </p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="createIntegration">新增整合紀錄 Demo</button>
        <button @click="createNotification">新增通知 Demo</button>
        <button @click="createReport">新增報表 Demo</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">系統整合</div>
        <div class="metric-value">{{ integrations.length }}</div>
        <div class="metric-hint">MES / ERP / WMS</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">通知紀錄</div>
        <div class="metric-value">{{ notifications.length }}</div>
        <div class="metric-hint">Email / LINE / Teams</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">報表輸出</div>
        <div class="metric-value">{{ reports.length }}</div>
        <div class="metric-hint">Excel / PDF / BI</div>
      </div>
    </div>

    <div class="card">
      <h2>MES / ERP / WMS 整合紀錄</h2>
      <DataTable :columns="integrationColumns" :rows="integrations" :labels="integrationLabels" />
    </div>

    <div class="card">
      <h2>Email / LINE / Teams 通知</h2>
      <DataTable :columns="notificationColumns" :rows="notifications" :labels="notificationLabels" />
    </div>

    <div class="card">
      <h2>Excel / PDF / BI 報表輸出</h2>
      <DataTable :columns="reportColumns" :rows="reports" :labels="reportLabels" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const integrations = ref([])
const notifications = ref([])
const reports = ref([])

const integrationColumns = ['integration_id', 'integration_time', 'target_system', 'direction', 'api_name', 'status', 'message']
const integrationLabels = {
  integration_id: '編號',
  integration_time: '時間',
  target_system: '系統',
  direction: '方向',
  api_name: 'API',
  status: '狀態',
  message: '訊息'
}

const notificationColumns = ['notification_id', 'notification_time', 'channel_type', 'receiver', 'subject', 'send_status', 'related_work_order_no']
const notificationLabels = {
  notification_id: '編號',
  notification_time: '時間',
  channel_type: '渠道',
  receiver: '接收者',
  subject: '主旨',
  send_status: '狀態',
  related_work_order_no: '製令單'
}

const reportColumns = ['report_job_id', 'report_time', 'report_type', 'report_name', 'file_format', 'file_path', 'job_status', 'created_by']
const reportLabels = {
  report_job_id: '編號',
  report_time: '時間',
  report_type: '報表類型',
  report_name: '報表名稱',
  file_format: '格式',
  file_path: '路徑',
  job_status: '狀態',
  created_by: '建立者'
}

async function load() {
  integrations.value = (await apiClient.get('/architecture/integrations')).data
  notifications.value = (await apiClient.get('/architecture/notifications')).data
  reports.value = (await apiClient.get('/architecture/reports')).data
}

async function createIntegration() {
  await apiClient.post('/architecture/integrations/demo').catch(showError)
  await load()
}

async function createNotification() {
  await apiClient.post('/architecture/notifications/demo').catch(showError)
  await load()
}

async function createReport() {
  await apiClient.post('/architecture/reports/demo').catch(showError)
  await load()
}

onMounted(load)

function showError(err) {
  const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'API 發生錯誤'
  alert(detail)
  throw err
}
</script>
