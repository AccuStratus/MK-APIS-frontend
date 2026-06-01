<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">線邊庫 / 人工推車物流模擬器</h1>
        <p class="page-subtitle">模擬入庫、領料、補料、退料與人工業務搬運，回寫線邊庫庫存。</p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="cartDemo">模擬人工推車補料</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card"><div class="metric-label">物流事件</div><div class="metric-value">{{ logs.length }}</div><div class="metric-hint">人工推車 / 補料</div></div>
      <div class="metric-card"><div class="metric-label">線邊庫快照</div><div class="metric-value">{{ inventory.length }}</div><div class="metric-hint">回寫 WMS / AIPS</div></div>
    </div>

    <div class="card"><h2>人工物流事件</h2><DataTable :columns="logColumns" :rows="logs" :labels="logLabels" /></div>
    <div class="card"><h2>線邊庫庫存快照</h2><DataTable :columns="invColumns" :rows="inventory" :labels="invLabels" /></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const logs=ref([])
const inventory=ref([])

const logColumns=['logistics_id','event_time','cart_code','operator_id','work_order_no','material_no','from_location','to_location','logistics_action','qty','event_status']
const logLabels={logistics_id:'編號',event_time:'時間',cart_code:'物流車',operator_id:'操作員',work_order_no:'製令單',material_no:'物料',from_location:'來源',to_location:'目的地',logistics_action:'動作',qty:'數量',event_status:'狀態'}

const invColumns=['snapshot_id','snapshot_time','cnc_machine_id','material_no','current_qty','reserved_qty','available_qty','safety_stock_qty','shortage_flag','shortage_qty','source_system']
const invLabels={snapshot_id:'編號',snapshot_time:'時間',cnc_machine_id:'CNC',material_no:'物料',current_qty:'目前量',reserved_qty:'保留量',available_qty:'可用量',safety_stock_qty:'安全庫存',shortage_flag:'缺料',shortage_qty:'缺料量',source_system:'來源'}

async function load(){
  logs.value=(await apiClient.get('/hardware-simulator/logistics')).data
  inventory.value=(await apiClient.get('/inventory/snapshots/latest')).data
}

async function cartDemo(){
  await apiClient.post('/hardware-simulator/logistics/cart-demo').catch(showError)
  await load()
}

onMounted(load)

function showError(err) {
  const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'API 發生錯誤'
  alert(detail)
}
</script>
