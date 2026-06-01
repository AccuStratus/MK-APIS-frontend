<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">CNC 智慧電表</h1>
        <p class="page-subtitle">
          接收 CNC 智慧電表回傳的功率、需量、THD 等資料，轉成 AI 可用的設備狀態特徵。
        </p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="insertRaw">新增電表資料</button>
        <button @click="calculateFeature">計算此 CNC 特徵</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="card">
      <h2>新增電表資料</h2>

      <div class="form-grid">
        <label>CNC 機台<input v-model="form.cnc_machine_id" /></label>
        <label>設備 IP<input v-model="form.device_ip" /></label>
        <label>功率 kW<input v-model.number="form.power_kw" type="number" /></label>
        <label>需量 kW<input v-model.number="form.demand_kw" type="number" /></label>
        <label>THD 電流<input v-model.number="form.thd_current" type="number" /></label>
        <label>功率因數<input v-model.number="form.power_factor" type="number" /></label>
        <label>累積電量<input v-model.number="form.power_kwh" type="number" /></label>
      </div>

      <div class="stock-summary">
        <div class="stock-box">
          <span>功率狀態</span>
          <strong>{{ powerStatus }}</strong>
        </div>
        <div class="stock-box" :class="{ danger: form.thd_current >= 15 }">
          <span>THD 判斷</span>
          <strong>{{ form.thd_current >= 15 ? '諧波偏高' : '正常' }}</strong>
        </div>
        <div class="stock-box">
          <span>預估機台</span>
          <strong>{{ estimatedMachineStatus }}</strong>
        </div>
      </div>
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
import { computed, onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const form = ref({
  cnc_machine_id: 'CNC-01',
  device_ip: '192.168.1.200',
  power_kw: 6.5,
  demand_kw: 7.0,
  thd_current: 8.0,
  power_factor: 0.92,
  power_kwh: 1000
})

const rows = ref([])
const features = ref([])

const rawColumns = ['meter_data_id', 'collect_time', 'cnc_machine_id', 'power_kw', 'demand_kw', 'thd_current', 'power_factor', 'device_ip']
const rawLabels = {
  meter_data_id: '編號',
  collect_time: '收集時間',
  cnc_machine_id: 'CNC 機台',
  power_kw: '功率 kW',
  demand_kw: '需量 kW',
  thd_current: 'THD 電流',
  power_factor: '功率因數',
  device_ip: '設備 IP'
}

const featureColumns = ['feature_id', 'feature_time', 'cnc_machine_id', 'avg_power_kw_5min', 'thd_current_avg', 'estimated_machine_status', 'machine_abnormal_power_flag']
const featureLabels = {
  feature_id: '編號',
  feature_time: '特徵時間',
  cnc_machine_id: 'CNC 機台',
  avg_power_kw_5min: '5 分鐘平均功率',
  thd_current_avg: '平均 THD 電流',
  estimated_machine_status: '預估狀態',
  machine_abnormal_power_flag: '電力異常'
}

const powerStatus = computed(() => {
  if (form.value.power_kw >= 12) return '高負載'
  if (form.value.power_kw >= 3) return '加工中'
  if (form.value.power_kw >= 0.5) return '待機'
  return '停止'
})

const estimatedMachineStatus = computed(() => {
  if (form.value.thd_current >= 15 || form.value.power_kw >= 12) return 'ABNORMAL'
  if (form.value.power_kw >= 3) return 'RUNNING'
  if (form.value.power_kw >= 0.5) return 'IDLE'
  return 'STOPPED'
})

async function insertRaw() {
  await apiClient.post('/meter/raw', {
    ...form.value,
    meter_id: `METER-${form.value.cnc_machine_id}`,
    mqtt_topic: `AIPS/${form.value.cnc_machine_id}/METER`,
    voltage_r: 220,
    voltage_s: 220,
    voltage_t: 220,
    current_r: 12,
    current_s: 12,
    current_t: 12,
    frequency_hz: 60,
    thd_voltage: 2.1,
    phase_imbalance_rate: 1.2
  })
  await load()
}

async function calculateFeature() {
  await apiClient.post(`/meter/features/calculate/${form.value.cnc_machine_id}`)
  await load()
}

async function load() {
  rows.value = (await apiClient.get('/meter/raw/latest')).data
  features.value = (await apiClient.get('/meter/features/latest')).data
}

onMounted(load)
</script>
