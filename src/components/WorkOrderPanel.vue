<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">ERP 製令單</h1>
        <p class="page-subtitle">
          用來模擬 ERP 拋入 AIPS 的製令單進度資料，作為 AI 排程與交期風險判斷基礎。
        </p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="create">新增製令單</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="card">
      <h2>新增製令單資料</h2>

      <div class="form-grid">
        <label>
          製令單號
          <input v-model="form.work_order_no" />
        </label>

        <label>
          產品料號
          <input v-model="form.product_no" />
        </label>

        <label>
          產品名稱
          <input v-model="form.product_name" />
        </label>

        <label>
          製程代碼
          <input v-model="form.process_code" />
        </label>

        <label>
          計畫數量
          <input v-model.number="form.planned_qty" type="number" />
        </label>

        <label>
          已完成數量
          <input v-model.number="form.completed_qty" type="number" />
        </label>

        <label>
          良品數
          <input v-model.number="form.good_qty" type="number" />
        </label>

        <label>
          不良品數
          <input v-model.number="form.ng_qty" type="number" />
        </label>

        <label>
          剩餘數量
          <input v-model.number="form.remaining_qty" type="number" />
        </label>

        <label>
          優先權 1-10
          <input v-model.number="form.priority_level" type="number" />
        </label>

        <label>
          指定 CNC 機台
          <input v-model="form.assigned_cnc_machine_id" />
        </label>

        <label>
          預估剩餘工時
          <input v-model.number="form.estimated_remaining_hours" type="number" />
        </label>

        <label>
          交期
          <input v-model="form.due_date_text" placeholder="YYYY-MM-DD HH:mm:ss" />
        </label>

        <label>
          製令狀態
          <input v-model="form.current_process_status" />
        </label>
      </div>

      <div class="form-preview">
        <div>
          <strong>目前判斷：</strong>
          <span :class="riskClass">{{ riskText }}</span>
        </div>
        <div>
          <strong>說明：</strong>
          ERP 製令單會與 CNC 電表、WMS 線邊庫一起轉成 DQN State。
        </div>
      </div>
    </div>

    <div class="card">
      <h2>製令單清單</h2>
      <DataTable :columns="columns" :rows="rows" :labels="labels" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const form = ref({
  work_order_no: 'WO-202606-NEW',
  product_no: 'P-NEW',
  product_name: '新零件',
  process_code: 'CNC-MILLING',
  planned_qty: 100,
  completed_qty: 10,
  good_qty: 10,
  ng_qty: 0,
  remaining_qty: 90,
  priority_level: 8,
  current_process_status: 'PROCESSING',
  assigned_cnc_machine_id: 'CNC-01',
  estimated_remaining_hours: 8,
  delay_risk_flag: false,
  due_date_text: formatLocalDateTime(new Date(Date.now() + 24 * 3600 * 1000))
})

const rows = ref([])

const columns = [
  'snapshot_id',
  'snapshot_time',
  'work_order_no',
  'product_no',
  'product_name',
  'remaining_qty',
  'due_date',
  'priority_level',
  'assigned_cnc_machine_id',
  'estimated_remaining_hours',
  'current_process_status'
]

const labels = {
  snapshot_id: '編號',
  snapshot_time: '快照時間',
  work_order_no: '製令單號',
  product_no: '產品料號',
  product_name: '產品名稱',
  remaining_qty: '剩餘數量',
  due_date: '交期',
  priority_level: '優先權',
  assigned_cnc_machine_id: '指定 CNC',
  estimated_remaining_hours: '剩餘工時',
  current_process_status: '狀態'
}

const riskText = computed(() => {
  if (form.value.priority_level >= 8 || form.value.estimated_remaining_hours >= 12) {
    return '高優先或可能有交期風險'
  }
  return '一般製令單'
})

const riskClass = computed(() => {
  if (form.value.priority_level >= 8 || form.value.estimated_remaining_hours >= 12) {
    return 'text-warning'
  }
  return 'text-success'
})

function formatLocalDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function toIsoDate(text) {
  if (!text) return new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  return text.replace(' ', 'T')
}

async function create() {
  const payload = {
    ...form.value,
    due_date: toIsoDate(form.value.due_date_text),
    delay_risk_flag: form.value.priority_level >= 8 || form.value.estimated_remaining_hours >= 12
  }
  delete payload.due_date_text

  await apiClient.post('/work-orders/snapshots', payload)
  await load()
}

async function load() {
  rows.value = (await apiClient.get('/work-orders/snapshots/latest')).data
}

onMounted(load)
</script>
