<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">AIPS / MK-AIPS 智慧排程總覽</h1>
        <p class="page-subtitle">
          整合 CNC 智慧電表、ERP 製令單、WMS 線邊庫資料，建立 DQN State，產生排程建議與 Reward 回饋。
        </p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="runFullFlow">一鍵執行 AIPS 流程</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">CNC 電表資料</div>
        <div class="metric-value">{{ summary.cnc_meter_raw_data || 0 }}</div>
        <div class="metric-hint">智慧電表原始回傳筆數</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">ERP 製令單</div>
        <div class="metric-value">{{ summary.work_order_progress_snapshot || 0 }}</div>
        <div class="metric-hint">目前製令單快照筆數</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">WMS 線邊庫</div>
        <div class="metric-value">{{ summary.line_side_inventory_snapshot || 0 }}</div>
        <div class="metric-hint">線邊庫庫存快照筆數</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">DQN 排程建議</div>
        <div class="metric-value">{{ summary.aips_dqn_action_log || 0 }}</div>
        <div class="metric-hint">AI 已產生的建議數</div>
      </div>
    </div>

    <div class="card">
      <h2>AI 排程流程</h2>
      <div class="flow-grid">
        <div class="flow-step">
          <strong>1. 資料收集</strong>
          <span>CNC 電力、ERP 製令單、WMS 線邊庫庫存。</span>
        </div>
        <div class="flow-step">
          <strong>2. 特徵工程</strong>
          <span>計算功率、THD、機台狀態、缺料風險。</span>
        </div>
        <div class="flow-step">
          <strong>3. DQN State</strong>
          <span>整合設備、工單、庫存、交期、OEE 狀態。</span>
        </div>
        <div class="flow-step">
          <strong>4. 排程建議</strong>
          <span>提前補料、提高優先權、換機、預防保養。</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>最新建議</h2>

      <div class="action-list">
        <div
          v-for="action in latestActions"
          :key="action.action_id"
          class="action-card"
          :class="actionClass(action)"
        >
          <div class="action-title">
            <div>{{ action.action_name || action.action_type }}</div>
            <span class="badge">信心 {{ toPercent(action.action_confidence_score) }}</span>
          </div>

          <div class="action-meta">
            製令單：{{ action.work_order_no || '-' }}　
            機台：{{ action.original_cnc_machine_id || '-' }}　
            預估 OEE 改善：{{ toPercent(action.expected_oee_improvement_rate) }}
          </div>

          <div class="action-reason">
            {{ action.action_reason || '尚無建議原因' }}
          </div>
        </div>

        <div v-if="latestActions.length === 0" class="action-card">
          目前尚未產生 DQN 建議，請先按「一鍵執行 AIPS 流程」。
        </div>
      </div>
    </div>

    <div class="card">
      <h2>技術資料表</h2>
      <DataTable :columns="actionColumns" :rows="latestActions" :labels="actionLabels" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const summary = ref({})

const latestActions = computed(() => summary.value.latest_actions || [])

const actionColumns = [
  'action_id',
  'action_time',
  'action_name',
  'work_order_no',
  'original_cnc_machine_id',
  'expected_oee_improvement_rate',
  'action_confidence_score',
  'action_reason'
]

const actionLabels = {
  action_id: '編號',
  action_time: '時間',
  action_name: '建議動作',
  work_order_no: '製令單',
  original_cnc_machine_id: 'CNC 機台',
  expected_oee_improvement_rate: '預估 OEE 改善',
  action_confidence_score: '信心分數',
  action_reason: '建議原因'
}

function toPercent(value) {
  const n = Number(value || 0)
  return `${(n * 100).toFixed(0)}%`
}

function actionClass(action) {
  const name = action.action_name || ''
  const reason = action.action_reason || ''

  if (name.includes('補料') || reason.includes('缺料')) return 'danger'
  if (name.includes('保養') || reason.includes('異常')) return 'warning'
  if (name.includes('維持')) return 'success'
  return ''
}

async function load() {
  const res = await apiClient.get('/dashboard/summary')
  summary.value = res.data
}

async function runFullFlow() {
  await apiClient.post('/meter/features/calculate/CNC-01').catch(() => {})
  await apiClient.post('/meter/features/calculate/CNC-02').catch(() => {})
  await apiClient.post('/meter/features/calculate/CNC-03').catch(() => {})
  await apiClient.post('/aips/states/build')
  await apiClient.post('/aips/dqn/generate-actions')
  await apiClient.post('/aips/predictions/run')
  await apiClient.post('/aips/rewards/calculate')
  await load()
}

onMounted(load)
</script>
