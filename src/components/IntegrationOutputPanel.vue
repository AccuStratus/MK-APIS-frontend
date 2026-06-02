<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">對外整合輸出</h1>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="createIntegration">新增整合紀錄 Demo</button>
        <button @click="createNotification">新增通知 Demo</button>
        <button @click="exportReport('excel')">輸出 Excel</button>
        <button @click="exportReport('pdf')">輸出 PDF</button>
        <button @click="exportReport('html')">輸出 BI HTML</button>
        <button @click="exportReport('csv')">輸出 CSV</button>
        <button @click="cleanupDemoReports">清除舊 Demo</button>
        <button class="danger-outline-btn" @click="deleteAllReports">刪除全部報表</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div v-if="exportMessage" class="export-message">{{ exportMessage }}</div>

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
        <div class="metric-hint">Excel / PDF / BI / CSV</div>
      </div>
    </div>

    <div class="report-design-card">
      <div class="report-design-title">報表美化格式</div>
      <div class="report-preview">
        <div class="report-preview-header">
          <div>
            <strong>MinKing AIPS 智慧排程報表</strong>
            <span>CNC 智慧電表 / OEE / DQN</span>
          </div>
          <div class="report-preview-badge">正式輸出</div>
        </div>
        <div class="report-preview-kpis">
          <div><span>總用電 kWh</span><b>自動彙總</b></div>
          <div><span>平均功率</span><b>kW</b></div>
          <div><span>最大需量</span><b>Demand</b></div>
          <div><span>異常機台</span><b>THD / Power</b></div>
          <div><span>碳排 kg</span><b>0.494 係數</b></div>
        </div>
        <div class="report-preview-note">
          Excel 會含標題、KPI 卡片、凍結窗格、自動篩選、異常列底色與功率圖表；PDF 會用橫式 A4 與中文表格；BI HTML 可直接用瀏覽器開啟。舊 Demo 路徑若沒有實體檔，後端會自動重產報表。
        </div>
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
      <h2>Excel / PDF / BI / CSV 報表輸出</h2>
      <DataTable :columns="reportColumns" :rows="reportRows" :labels="reportLabels">
        <template #actions="{ row }">
          <button @click="download(row)">下載</button>
        </template>
      </DataTable>

      <div class="report-list">
        <div v-for="report in reports" :key="report.report_job_id" class="report-item">
          <div>
            <strong>{{ report.report_name }}</strong>
            <span>{{ report.file_format }}｜{{ report.report_time }}｜{{ fileHint(report) }}</span>
          </div>
          <div class="report-actions">
            <button class="primary-btn" @click="download(report)">下載</button>
            <button class="danger-outline-btn" @click="deleteReport(report)">刪除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const integrations = ref([])
const notifications = ref([])
const reports = ref([])
const exportMessage = ref('')

const integrationColumns = ['integration_id', 'integration_time', 'target_system', 'direction', 'api_name', 'status', 'message']
const integrationLabels = { integration_id: '編號', integration_time: '時間', target_system: '系統', direction: '方向', api_name: 'API', status: '狀態', message: '訊息' }

const notificationColumns = ['notification_id', 'notification_time', 'channel_type', 'receiver', 'subject', 'send_status', 'related_work_order_no']
const notificationLabels = { notification_id: '編號', notification_time: '時間', channel_type: '渠道', receiver: '接收者', subject: '主旨', send_status: '狀態', related_work_order_no: '製令單' }

const reportColumns = ['report_job_id', 'report_time', 'report_type', 'report_name', 'file_format', 'job_status', 'created_by']
const reportLabels = { report_job_id: '編號', report_time: '時間', report_type: '報表類型', report_name: '報表名稱', file_format: '格式', job_status: '狀態', created_by: '建立者' }
const reportRows = computed(() => reports.value)

async function load() {
  integrations.value = (await apiClient.get('/architecture/integrations')).data || []
  notifications.value = (await apiClient.get('/architecture/notifications')).data || []
  reports.value = (await apiClient.get('/architecture/reports')).data || []
}

async function createIntegration() {
  await apiClient.post('/architecture/integrations/demo').catch(showError)
  await load()
}

async function createNotification() {
  await apiClient.post('/architecture/notifications/demo').catch(showError)
  await load()
}

function filenameFromDisposition(disposition, fallback) {
  if (!disposition) return fallback
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match) return decodeURIComponent(utf8Match[1])
  const match = disposition.match(/filename="?([^"]+)"?/i)
  return match ? match[1] : fallback
}

function directDownload(path, message) {
  exportMessage.value = message
  const base = apiClient.defaults.baseURL || ''
  const sep = path.includes('?') ? '&' : '?'
  const url = `${base}${path}${sep}_t=${Date.now()}`
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()

  setTimeout(() => {
    load()
  }, 1500)
}

async function exportReport(format) {
  directDownload(`/architecture/reports/export-file/${format}`, `正在產生 ${format.toUpperCase()} 報表，瀏覽器會開始下載...`)
}

function fileHint(report) {
  const path = report.file_path || ''
  if (path.startsWith('/reports/')) return '舊 Demo 路徑，下載時會自動重產'
  return path
}

async function download(report) {
  directDownload(`/architecture/reports/download/${report.report_job_id}`, '正在下載報表...')
}


async function deleteReport(report) {
  if (!confirm(`確定刪除報表：${report.report_name || report.report_job_id}？`)) return
  await apiClient.delete(`/architecture/reports/${report.report_job_id}`).catch(showError)
  exportMessage.value = '報表已刪除'
  await load()
}

async function deleteAllReports() {
  if (!confirm('確定刪除全部報表紀錄與已產生檔案？')) return
  await apiClient.delete('/architecture/reports').catch(showError)
  exportMessage.value = '全部報表已刪除'
  await load()
}

async function cleanupDemoReports() {
  await apiClient.post('/architecture/reports/cleanup-demo').catch(showError)
  exportMessage.value = '舊 Demo 假路徑報表已清除'
  await load()
}

onMounted(load)

function showError(err) {
  const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'API 發生錯誤'
  alert(detail)
  throw err
}
</script>
