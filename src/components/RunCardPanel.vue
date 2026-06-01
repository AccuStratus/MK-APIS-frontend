<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">製令流程卡 / AI 排程資料</h1>
        <p class="page-subtitle">
          依「生產流程卡」格式建立單頭、單身，並產生 LSTM / ARIMA 特徵與 DQN 排程建議。
        </p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="createDemo">新增流程卡 Demo</button>
        <button @click="autoCreateDetails">補齊單身</button>
        <button @click="generateFeatures">產生 LSTM / ARIMA 特徵</button>
        <button @click="generateDqn">產生 DQN 建議</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div v-if="message" class="form-preview">
      <strong>操作結果：</strong>{{ message }}
    </div>

    <div class="form-preview">
      <strong>AI 引擎狀態：</strong>
      PyTorch={{ aiStatus.pytorch ? '已啟用' : '未啟用' }}
      <span v-if="aiStatus.torch_version">({{ aiStatus.torch_version }})</span>，
      statsmodels ARIMA={{ aiStatus.statsmodels ? '已啟用' : '未啟用' }}
      <span v-if="aiStatus.statsmodels_version">({{ aiStatus.statsmodels_version }})</span>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">流程卡單頭</div>
        <div class="metric-value">{{ headers.length }}</div>
        <div class="metric-hint">AIPS_RUN_CARD_HEADER</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">AI 特徵</div>
        <div class="metric-value">{{ features.length }}</div>
        <div class="metric-hint">LSTM / ARIMA Feature</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">DQN 建議</div>
        <div class="metric-value">{{ suggestions.length }}</div>
        <div class="metric-hint">Action Suggestion</div>
      </div>
    </div>

    <div class="card">
      <h2>新增流程卡單頭</h2>
      <div class="form-grid">
        <label>流程卡號<input v-model="form.run_card_no" /></label>
        <label>生產批號<input v-model="form.production_batch_no" /></label>
        <label>製令單號<input v-model="form.work_order_no" /></label>
        <label>客戶名稱<input v-model="form.customer_name" /></label>
        <label>產品料號<input v-model="form.product_no" /></label>
        <label>物料編號<input v-model="form.material_no" /></label>
        <label>Piece ID<input v-model="form.piece_id" /></label>
        <label>S/N<input v-model="form.serial_no" /></label>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="createHeader">新增單頭</button>
      </div>
    </div>

    <div class="card">
      <h2>流程卡單頭</h2>
      <DataTable :columns="headerColumns" :rows="headers" :labels="headerLabels" />
    </div>

    <div class="card">
      <h2>目前選取流程卡單身</h2>
      <div class="toolbar">
        <select v-model="selectedRunCardId" @change="loadDetail">
          <option value="">請選擇流程卡</option>
          <option v-for="h in headers" :key="h.run_card_id" :value="h.run_card_id">
            {{ h.run_card_no }} / {{ h.work_order_no }}
          </option>
        </select>
      </div>
      <DataTable :columns="detailColumns" :rows="details" :labels="detailLabels" />
    </div>

    <div class="card">
      <h2>LSTM / ARIMA 特徵</h2>
      <DataTable :columns="featureColumns" :rows="features" :labels="featureLabels" />
    </div>

    <div class="card">
      <h2>DQN 排程建議</h2>
      <DataTable :columns="suggestionColumns" :rows="suggestions" :labels="suggestionLabels" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const headers = ref([])
const details = ref([])
const features = ref([])
const suggestions = ref([])
const selectedRunCardId = ref('')
const message = ref('')
const aiStatus = ref({})

const form = ref({
  run_card_no: 'MK20240069',
  production_batch_no: 'MK20260111003',
  work_order_no: 'WO-RUNCARD-DEMO',
  customer_name: 'UMC',
  product_no: 'MK030001',
  material_no: '3D10-260318-11',
  piece_id: 'A123-456-789',
  serial_no: '20260401 ZH-260318'
})

const headerColumns = ['run_card_id', 'run_card_no', 'production_batch_no', 'work_order_no', 'customer_name', 'product_no', 'material_no', 'planned_qty', 'remaining_qty', 'due_date', 'priority_level', 'run_card_status']
const headerLabels = { run_card_id: '編號', run_card_no: '流程卡號', production_batch_no: '生產批號', work_order_no: '製令單', customer_name: '客戶', product_no: '產品料號', material_no: '物料編號', planned_qty: '預計數量', remaining_qty: '剩餘量', due_date: '交期', priority_level: '優先級', run_card_status: '狀態' }

const detailColumns = ['sequence_no', 'station_name', 'station_sub_name', 'process_type', 'cnc_machine_id', 'planned_qty', 'control_spec_text', 'standard_cycle_time_sec', 'delay_minutes', 'shortage_flag', 'avg_power_kw', 'avg_thd_current', 'quality_risk_score', 'detail_status']
const detailLabels = { sequence_no: '順序', station_name: '站別', station_sub_name: '站別補充', process_type: '製程類型', cnc_machine_id: 'CNC', planned_qty: '製作數量', control_spec_text: '管制規格', standard_cycle_time_sec: '標準秒數', delay_minutes: '延遲分鐘', shortage_flag: '缺料', avg_power_kw: '平均功率', avg_thd_current: 'THD', quality_risk_score: '品質風險', detail_status: '狀態' }

const featureColumns = ['feature_id', 'work_order_no', 'station_name', 'cnc_machine_id', 'arima_predicted_minutes', 'lstm_predicted_minutes', 'delay_risk_score', 'shortage_risk_score', 'quality_risk_score', 'power_risk_score']
const featureLabels = { feature_id: '編號', work_order_no: '製令單', station_name: '站別', cnc_machine_id: 'CNC', arima_predicted_minutes: 'ARIMA預測分鐘', lstm_predicted_minutes: 'LSTM預測分鐘', delay_risk_score: '延遲風險', shortage_risk_score: '缺料風險', quality_risk_score: '品質風險', power_risk_score: '電力風險' }

const suggestionColumns = ['action_id', 'action_time', 'work_order_no', 'cnc_machine_id', 'action_type', 'action_name', 'reason', 'action_status']
const suggestionLabels = { action_id: '建議編號', action_time: '時間', work_order_no: '製令單', station_name: '站別', cnc_machine_id: 'CNC', action_type: 'Action', action_name: '建議', reason: '原因', action_status: '狀態' }

async function loadDqnActions() {
  const res = await apiClient.get('/run-cards/dqn/actions')
  suggestions.value = res.data || []
}

async function loadAiStatus() {
  aiStatus.value = (await apiClient.get('/run-cards/ai/status')).data || {}
}

async function load() {
  await loadAiStatus()
  headers.value = (await apiClient.get('/run-cards/headers')).data || []
  features.value = (await apiClient.get('/run-cards/features')).data || []
  await loadDqnActions()
  if (!selectedRunCardId.value && headers.value.length > 0) {
    selectedRunCardId.value = headers.value[0].run_card_id
  }
  await loadDetail()
}

async function loadDetail() {
  if (!selectedRunCardId.value) {
    details.value = []
    return
  }
  const res = await apiClient.get(`/run-cards/headers/${selectedRunCardId.value}`)
  details.value = res.data?.details || []
}

async function createHeader() {
  const res = await apiClient.post('/run-cards/headers', form.value)
  message.value = `已新增流程卡單頭：${res.data.run_card_id}，自動建立單身 ${res.data.detail_count || 0} 筆`
  await load()
}

async function createDemo() {
  const res = await apiClient.post('/run-cards/demo')
  message.value = res.data.message || '已新增 Demo'
  selectedRunCardId.value = res.data.run_card_id
  await load()
}

async function autoCreateDetails() {
  const res = await apiClient.post('/run-cards/details/auto-create')
  message.value = `已自動補齊單身 ${res.data.created_detail_count || 0} 筆`
  await load()
}

async function generateFeatures() {
  const res = await apiClient.post('/run-cards/features/generate')
  message.value = res.data.message || `已補單身 ${res.data.auto_created_detail_count || 0} 筆，產生 ${res.data.created || 0} 筆 AI 特徵`
  await load()
}

async function generateDqn() {
  const res = await apiClient.post('/run-cards/dqn/suggest')
  suggestions.value = res.data.latest || res.data.suggestions || []
  message.value = `已產生 ${res.data.suggestions?.length || suggestions.value.length} 筆 DQN 建議，並已寫入 DB`
  await loadDqnActions()
}

onMounted(load)
</script>
