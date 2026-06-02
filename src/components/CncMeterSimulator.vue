<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">CNC 機台 + 智慧電表模擬器</h1>
        <p class="page-subtitle">
          智慧電表資料已改為 FFA 電表介面資料格式，並與 CNC、AIPS 特徵工程、DQN State 串聯。
        </p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="sendMeter('CNC-01')">模擬 CNC-01</button>
        <button class="primary-btn" @click="sendMeter('CNC-02')">模擬 CNC-02</button>
        <button class="primary-btn" @click="sendMeter('CNC-03')">模擬 CNC-03</button>
        <button @click="seedAll">模擬全部</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="card">
      <h2>智慧電表與 CNC 串聯架構</h2>
      <div class="flow-grid">
        <div class="flow-step"><strong>1. CNC 智慧電表</strong><span>Modbus TCP / Ethernet 回傳功率、需量、THD、PF、kWh。</span></div>
        <div class="flow-step"><strong>2. 電表監控介面</strong><span>採 FFA 智慧電表畫面：本月用電、碳排、每月用電曲線。</span></div>
        <div class="flow-step"><strong>3. AIPS 特徵工程</strong><span>轉成 avg_power、THD、狀態、異常旗標。</span></div>
        <div class="flow-step"><strong>4. DQN State</strong><span>與 ERP 製令、WMS 線邊庫一起形成 AI 排程輸入。</span></div>
      </div>
    </div>

    <div class="card"><h2>模擬智慧電表</h2><DataTable :columns="simColumns" :rows="simMeters" :labels="simLabels" /></div>
    <div class="card"><h2>CNC 與智慧電表連線</h2><DataTable :columns="linkColumns" :rows="links" :labels="linkLabels" /></div>
    <div class="card"><h2>寫入後 CNC 電表資料</h2><DataTable :columns="rawColumns" :rows="rawRows" :labels="rawLabels" /></div>
    <div class="card"><h2>AI 特徵資料</h2><DataTable :columns="featureColumns" :rows="features" :labels="featureLabels" /></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const simMeters=ref([])
const links=ref([])
const rawRows=ref([])
const features=ref([])

const simColumns=['sim_meter_id','cnc_machine_id','meter_id','device_ip','protocol_type','modbus_unit_id','power_kw','demand_kw','thd_current','machine_status','online_flag']
const simLabels={sim_meter_id:'編號',cnc_machine_id:'CNC',meter_id:'電表ID',device_ip:'IP',protocol_type:'協定',modbus_unit_id:'Modbus ID',power_kw:'功率',demand_kw:'需量',thd_current:'THD',machine_status:'狀態',online_flag:'在線'}

const linkColumns=['cnc_machine_id','meter_id','device_ip','protocol_type','modbus_unit_id','connected_flag','machine_status','power_kw','demand_kw','thd_current','estimated_machine_status']
const linkLabels={cnc_machine_id:'CNC',meter_id:'電表ID',device_ip:'IP',protocol_type:'協定',modbus_unit_id:'Modbus ID',connected_flag:'連線',machine_status:'機台狀態',power_kw:'功率',demand_kw:'需量',thd_current:'THD',estimated_machine_status:'AI狀態'}

const rawColumns=['meter_data_id','collect_time','cnc_machine_id','power_kw','demand_kw','thd_current','device_ip']
const rawLabels={meter_data_id:'編號',collect_time:'時間',cnc_machine_id:'CNC',power_kw:'功率',demand_kw:'需量',thd_current:'THD',device_ip:'IP'}

const featureColumns=['feature_id','feature_time','cnc_machine_id','avg_power_kw_5min','thd_current_avg','estimated_machine_status','machine_abnormal_power_flag']
const featureLabels={feature_id:'編號',feature_time:'時間',cnc_machine_id:'CNC',avg_power_kw_5min:'平均功率',thd_current_avg:'平均THD',estimated_machine_status:'狀態',machine_abnormal_power_flag:'異常'}

async function load(){
  simMeters.value=(await apiClient.get('/hardware-simulator/cnc/meters')).data || []
  links.value=(await apiClient.get('/meter/electric/cnc-links')).data || []
  rawRows.value=(await apiClient.get('/meter/raw/latest')).data || []
  features.value=(await apiClient.get('/meter/features/latest')).data || []
}

async function sendMeter(cnc){
  await apiClient.post(`/meter/electric/demo/${cnc}`).catch(showError)
  await load()
}

async function seedAll(){
  await apiClient.post('/meter/electric/demo-all').catch(showError)
  await load()
}

onMounted(load)

function showError(err) {
  const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'API 發生錯誤'
  alert(detail)
}
</script>
