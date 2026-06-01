<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">NFC 卡 / QR Code 標籤模擬器</h1>
        <p class="page-subtitle">模擬員工識別、物流車、料件、工單、機台標籤掃描。</p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="scanDemo">模擬 NFC / QR 掃描</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="card"><h2>標籤綁定資料</h2><DataTable :columns="tagColumns" :rows="tags" :labels="tagLabels" /></div>
    <div class="card"><h2>掃描事件</h2><DataTable :columns="scanColumns" :rows="scans" :labels="scanLabels" /></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const tags = ref([])
const scans = ref([])

const tagColumns = ['tag_id','tag_code','tag_type','bind_target_type','bind_target_code','bind_target_name','enabled_flag','last_scan_time']
const tagLabels = { tag_id:'編號',tag_code:'標籤碼',tag_type:'類型',bind_target_type:'綁定類型',bind_target_code:'綁定代碼',bind_target_name:'綁定名稱',enabled_flag:'啟用',last_scan_time:'最後掃描' }

const scanColumns = ['scan_event_id','scan_time','scan_type','scan_code','operator_id','work_order_no','material_no','cnc_machine_id','event_status','event_message']
const scanLabels = { scan_event_id:'事件編號',scan_time:'時間',scan_type:'類型',scan_code:'掃描碼',operator_id:'操作員',work_order_no:'製令單',material_no:'料件',cnc_machine_id:'CNC',event_status:'狀態',event_message:'訊息' }

async function load(){
  tags.value=(await apiClient.get('/hardware-simulator/tags')).data
  scans.value=(await apiClient.get('/architecture/scan/events')).data
}

async function scanDemo(){
  await apiClient.post('/hardware-simulator/tags/scan-demo').catch(showError)
  await load()
}

onMounted(load)

function showError(err) {
  const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'API 發生錯誤'
  alert(detail)
}
</script>
