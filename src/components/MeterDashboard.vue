<template>
  <div class="page electric-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">智慧電表即時監控</h1>
      </div>
      <div class="toolbar">
        <select v-model="selectedCnc" class="select-control" @change="load">
          <option value="ALL">全部 CNC</option>
          <option value="CNC-01">CNC-01</option>
          <option value="CNC-02">CNC-02</option>
          <option value="CNC-03">CNC-03</option>
        </select>
        <button class="primary-btn" @click="seedAll">模擬三台 CNC 電表</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="electric-dashboard">
      <div class="electric-top">
        <div class="electric-card blueBlock">
          <div class="electric-value">{{ formatNumber(current.currentData?.monthlyAe) }} kWh</div>
          <div class="electric-footnote">本月用電度</div>
        </div>
        <div class="electric-card blueBlock color-down">
          <div class="electric-value">{{ formatNumber(current.currentData?.lastYearMonthlyAe) }} kWh</div>
          <div class="electric-footnote">去年同期用電度</div>
        </div>
        <div class="electric-card blueBlock">
          <div class="electric-value">{{ formatNumber(current.currentData?.carbonEmission) }} kg</div>
          <div class="electric-footnote">本月碳排量</div>
        </div>
        <div class="electric-card blueBlock color-down">
          <div class="electric-value">{{ formatNumber(current.currentData?.lastYearCarbonEmission) }} kg</div>
          <div class="electric-footnote">去年同期碳排量</div>
        </div>
      </div>

      <div class="electric-top">
        <div class="electric-card greenBlock">
          <div class="electric-value">{{ formatNumber(current.currentData?.p) }} kW</div>
          <div class="electric-footnote">即時用電量</div>
        </div>
        <div class="electric-card greenBlock">
          <div class="electric-value">{{ formatNumber(current.currentData?.pdm) }} kW</div>
          <div class="electric-footnote">最大需量</div>
        </div>
        <div class="electric-card" :class="{ dangerBlock: Number(current.currentData?.thdCurrent || 0) >= 15 }">
          <div class="electric-value">{{ formatNumber(current.currentData?.thdCurrent) }} %</div>
          <div class="electric-footnote">THD 電流</div>
        </div>
        <div class="electric-card">
          <div class="electric-value">{{ formatNumber(current.currentData?.pf, 2) }}</div>
          <div class="electric-footnote">功率因數</div>
        </div>
      </div>

      <div class="gauge-grid">
        <div class="gauge-card">
          <div class="gauge-title">電壓不平衡度</div>
          <div class="linear-gauge"><span :style="{ width: `${voltagePercent}%` }"></span></div>
          <div class="gauge-meta">{{ formatNumber(current.currentData?.uunbl) }} %｜{{ voltageStatus }}</div>
        </div>
        <div class="gauge-card">
          <div class="gauge-title">電流不平衡度</div>
          <div class="linear-gauge danger"><span :style="{ width: `${currentPercent}%` }"></span></div>
          <div class="gauge-meta">{{ formatNumber(current.currentData?.lunbl) }} %｜{{ currentStatus }}</div>
        </div>
        <div class="gauge-card">
          <div class="gauge-title">負載率</div>
          <div class="radial-text">{{ formatNumber(current.currentData?.loadFactor) }}%</div>
          <div class="linear-gauge load"><span :style="{ width: `${loadPercent}%` }"></span></div>
          <div class="gauge-meta">{{ current.currentData?.machineStatus || '-' }}</div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">每月用電量 / 最大需量 / 碳排量</div>
        <div class="bar-chart">
          <div v-for="row in current.monthlyDataList || []" :key="row.monthString" class="bar-item">
            <div class="bar-stack">
              <span class="bar-ae" :style="{ height: `${barHeight(row.maxAe)}%` }"></span>
              <span class="bar-ce" :style="{ height: `${barHeight(row.maxCe)}%` }"></span>
            </div>
            <div class="bar-label">{{ row.monthString }}</div>
          </div>
        </div>
        <div class="chart-legend">
          <span><i class="legend-ae"></i>最大用電量</span>
          <span><i class="legend-ce"></i>最大碳排量</span>
          <span>最大需量：{{ formatNumber(lastMonthly?.maxPdm) }} kW</span>
        </div>
      </div>

      <div class="footer-time">{{ dateTimeString }}</div>
    </div>

    <div class="card">
      <h2>CNC 與智慧電表連線</h2>
      <DataTable :columns="linkColumns" :rows="current.cncLinks || []" :labels="linkLabels" />
    </div>

    <div class="card">
      <h2>CNC 電表原始資料</h2>
      <DataTable :columns="rawColumns" :rows="rows" :labels="rawLabels" />
    </div>

    <div class="card">
      <h2>AI 特徵資料</h2>
      <DataTable :columns="featureColumns" :rows="features" :labels="featureLabels" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const selectedCnc = ref('ALL')
const current = ref({})
const rows = ref([])
const features = ref([])
const dateTimeString = ref('')
let timer = null

const linkColumns = ['cnc_machine_id', 'meter_id', 'device_ip', 'protocol_type', 'modbus_unit_id', 'connected_flag', 'machine_status', 'power_kw', 'demand_kw', 'thd_current', 'estimated_machine_status']
const linkLabels = { cnc_machine_id: 'CNC', meter_id: '電表ID', device_ip: 'IP', protocol_type: '協定', modbus_unit_id: 'Modbus ID', connected_flag: '連線', machine_status: '機台狀態', power_kw: '功率', demand_kw: '需量', thd_current: 'THD', estimated_machine_status: 'AI狀態' }

const rawColumns = ['meter_data_id', 'collect_time', 'cnc_machine_id', 'power_kw', 'demand_kw', 'thd_current', 'power_factor', 'power_kwh', 'device_ip']
const rawLabels = { meter_data_id: '編號', collect_time: '收集時間', cnc_machine_id: 'CNC', power_kw: '功率 kW', demand_kw: '需量 kW', thd_current: 'THD', power_factor: '功率因數', power_kwh: '累積電量', device_ip: '設備 IP' }

const featureColumns = ['feature_id', 'feature_time', 'cnc_machine_id', 'avg_power_kw_5min', 'thd_current_avg', 'estimated_machine_status', 'machine_abnormal_power_flag']
const featureLabels = { feature_id: '編號', feature_time: '特徵時間', cnc_machine_id: 'CNC', avg_power_kw_5min: '5分鐘平均功率', thd_current_avg: '平均THD', estimated_machine_status: 'AI狀態', machine_abnormal_power_flag: '電力異常' }

const voltagePercent = computed(() => Math.min(Number(current.value.currentData?.uunbl || 0) / 10 * 100, 100))
const currentPercent = computed(() => Math.min(Number(current.value.currentData?.lunbl || 0) / 15 * 100, 100))
const loadPercent = computed(() => Math.min(Number(current.value.currentData?.loadFactor || 0), 100))
const lastMonthly = computed(() => (current.value.monthlyDataList || []).slice(-1)[0])

const voltageStatus = computed(() => {
  const v = Number(current.value.currentData?.uunbl || 0)
  if (v >= 8) return '危險'
  if (v >= 5) return '異常'
  if (v >= 2) return '注意'
  return '正常'
})

const currentStatus = computed(() => {
  const v = Number(current.value.currentData?.lunbl || 0)
  if (v >= 12) return '危險'
  if (v >= 8) return '異常'
  return '正常'
})

function formatNumber(value, decimals = 1) {
  const n = Number(value || 0)
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function barHeight(value) {
  const rows = current.value.monthlyDataList || []
  const max = Math.max(...rows.map(r => Math.max(Number(r.maxAe || 0), Number(r.maxCe || 0))), 1)
  return Math.max(8, Math.round(Number(value || 0) / max * 100))
}

function updateTime() {
  const d = new Date()
  dateTimeString.value = d.toLocaleString('zh-TW', { hour12: false })
}

async function seedAll() {
  await apiClient.post('/meter/electric/demo-all')
  await load()
}

async function load() {
  current.value = (await apiClient.get('/meter/electric/monitor', { params: { cnc_machine_id: selectedCnc.value } })).data || {}
  rows.value = (await apiClient.get('/meter/raw/latest')).data || []
  features.value = (await apiClient.get('/meter/features/latest')).data || []
}

onMounted(() => {
  updateTime()
  load()
  timer = setInterval(() => {
    updateTime()
    load()
  }, 5000)
})

onUnmounted(() => clearInterval(timer))
</script>
