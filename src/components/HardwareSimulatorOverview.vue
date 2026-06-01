<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">現場設備與作業區模擬器</h1>
        <p class="page-subtitle">WiFi PDA、NFC / QR Code、CNC 智慧電表、線邊庫人工物流，全部串到 FastAPI、PostgreSQL 與 AIPS 流程。</p>
      </div>
      <button @click="load">重新整理</button>
    </div>

    <div class="arch-grid">
      <div v-for="module in modules" :key="module.code" class="arch-card">
        <h2>{{ module.code }}. {{ module.name }}</h2>
        <p>{{ module.description }}</p>
      </div>
    </div>

    <div class="card">
      <h2>串接資料流</h2>
      <div class="flow-grid">
        <div v-for="(step, index) in flow" :key="step" class="flow-step">
          <strong>{{ index + 1 }}. {{ step }}</strong>
          <span>模擬器寫入 PostgreSQL，並同步產生 AIPS 事件 / State / Action 所需資料。</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>與既有 AIPS 串接關係</h2>
      <DataTable :columns="columns" :rows="rows" :labels="labels" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const modules = ref([])
const flow = ref([])

const columns = ['hardware_module', 'simulator_api', 'write_tables', 'aips_effect']
const labels = { hardware_module: '硬體模組', simulator_api: '模擬 API', write_tables: '寫入資料表', aips_effect: '串接效果' }

const rows = [
  { hardware_module: 'WiFi PDA / Android', simulator_api: '/api/hardware-simulator/pda/scan-demo', write_tables: 'aips_scan_event, aips_realtime_event_log', aips_effect: '形成現場掃描事件' },
  { hardware_module: 'NFC / QR Code 標籤', simulator_api: '/api/hardware-simulator/tags/scan-demo', write_tables: 'aips_scan_event, aips_sim_nfc_qrcode_tag', aips_effect: '識別員工、料件、工單、CNC 機台' },
  { hardware_module: 'CNC + 智慧電表', simulator_api: '/api/hardware-simulator/cnc/meter-demo/{cnc_machine_id}', write_tables: 'cnc_meter_raw_data, cnc_meter_feature', aips_effect: '轉成 AI 特徵，進入 DQN State' },
  { hardware_module: '線邊庫 / 人工物流', simulator_api: '/api/hardware-simulator/logistics/cart-demo', write_tables: 'aips_sim_line_side_logistics, line_side_inventory_snapshot', aips_effect: '更新線邊庫庫存，影響缺料風險' }
]

async function load() {
  const res = await apiClient.get('/hardware-simulator/overview')
  modules.value = res.data.modules
  flow.value = res.data.flow
}

onMounted(load)
</script>
