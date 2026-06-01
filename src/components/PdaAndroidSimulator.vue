<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">WiFi PDA / Android 手持端模擬器</h1>
        <p class="page-subtitle">模擬 PDA 掃描員工 / NFC、工單、CNC QR Code，透過 WiFi / HTTPS 傳入後端。</p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="scanDemo">模擬 PDA 掃描</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card"><div class="metric-label">PDA 裝置</div><div class="metric-value">{{ devices.length }}</div><div class="metric-hint">WiFi / Android</div></div>
      <div class="metric-card"><div class="metric-label">掃描事件</div><div class="metric-value">{{ scans.length }}</div><div class="metric-hint">已寫入事件流</div></div>
    </div>

    <div class="card"><h2>PDA 裝置</h2><DataTable :columns="deviceColumns" :rows="devices" :labels="deviceLabels" /></div>
    <div class="card"><h2>掃描事件</h2><DataTable :columns="scanColumns" :rows="scans" :labels="scanLabels" /></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const devices = ref([])
const scans = ref([])

const deviceColumns = ['pda_id','device_code','device_name','device_type','wifi_ssid','ip_address','operator_id','online_flag','last_scan_time']
const deviceLabels = { pda_id:'編號',device_code:'裝置代碼',device_name:'名稱',device_type:'類型',wifi_ssid:'WiFi',ip_address:'IP',operator_id:'操作員',online_flag:'在線',last_scan_time:'最後掃描' }

const scanColumns = ['scan_event_id','scan_time','scan_type','scan_code','operator_id','work_order_no','material_no','cnc_machine_id','event_status','event_message']
const scanLabels = { scan_event_id:'事件編號',scan_time:'時間',scan_type:'類型',scan_code:'掃描碼',operator_id:'操作員',work_order_no:'製令單',material_no:'料件',cnc_machine_id:'CNC',event_status:'狀態',event_message:'訊息' }

async function load(){
  devices.value=(await apiClient.get('/hardware-simulator/pda/devices')).data
  scans.value=(await apiClient.get('/architecture/scan/events')).data
}

async function scanDemo(){
  await apiClient.post('/hardware-simulator/pda/scan-demo').catch(showError)
  await load()
}

onMounted(load)

function showError(err) {
  const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'API 發生錯誤'
  alert(detail)
}
</script>
