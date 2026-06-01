<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">CNC 機台 + 智慧電表模擬器</h1>
        <p class="page-subtitle">模擬電流、電壓、功率、THD、運轉 / 待機 / 停機，透過 Modbus / Ethernet 回傳。</p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="sendMeter('CNC-01')">模擬 CNC-01</button>
        <button class="primary-btn" @click="sendMeter('CNC-02')">模擬 CNC-02</button>
        <button class="primary-btn" @click="sendMeter('CNC-03')">模擬 CNC-03</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="card"><h2>模擬智慧電表</h2><DataTable :columns="simColumns" :rows="simMeters" :labels="simLabels" /></div>
    <div class="card"><h2>寫入後 CNC 電表資料</h2><DataTable :columns="rawColumns" :rows="rawRows" :labels="rawLabels" /></div>
    <div class="card"><h2>AI 特徵資料</h2><DataTable :columns="featureColumns" :rows="features" :labels="featureLabels" /></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const simMeters=ref([])
const rawRows=ref([])
const features=ref([])

const simColumns=['sim_meter_id','cnc_machine_id','meter_id','device_ip','protocol_type','modbus_unit_id','power_kw','demand_kw','thd_current','machine_status','online_flag']
const simLabels={sim_meter_id:'編號',cnc_machine_id:'CNC',meter_id:'電表ID',device_ip:'IP',protocol_type:'協定',modbus_unit_id:'Modbus ID',power_kw:'功率',demand_kw:'需量',thd_current:'THD',machine_status:'狀態',online_flag:'在線'}

const rawColumns=['meter_data_id','collect_time','cnc_machine_id','power_kw','demand_kw','thd_current','device_ip']
const rawLabels={meter_data_id:'編號',collect_time:'時間',cnc_machine_id:'CNC',power_kw:'功率',demand_kw:'需量',thd_current:'THD',device_ip:'IP'}

const featureColumns=['feature_id','feature_time','cnc_machine_id','avg_power_kw_5min','thd_current_avg','estimated_machine_status','machine_abnormal_power_flag']
const featureLabels={feature_id:'編號',feature_time:'時間',cnc_machine_id:'CNC',avg_power_kw_5min:'平均功率',thd_current_avg:'平均THD',estimated_machine_status:'狀態',machine_abnormal_power_flag:'異常'}

async function load(){
  simMeters.value=(await apiClient.get('/hardware-simulator/cnc/meters')).data
  rawRows.value=(await apiClient.get('/meter/raw/latest')).data
  features.value=(await apiClient.get('/meter/features/latest')).data
}

async function sendMeter(cnc){
  await apiClient.post(`/hardware-simulator/cnc/meter-demo/${cnc}`).catch(showError)
  await load()
}

onMounted(load)

function showError(err) {
  const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'API 發生錯誤'
  alert(detail)
}
</script>
