<template>
  <div class="page">
    <h1>AI 生產預測</h1>
    <div class="toolbar"><button @click="run">執行 LSTM / ARIMA Demo 預測</button><button @click="load">重新整理</button></div>
    <div class="card"><DataTable :columns="columns" :rows="rows" /></div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'
const rows = ref([])
const columns = ['prediction_id', 'prediction_time', 'model_name', 'work_order_no', 'cnc_machine_id', 'predicted_processing_time', 'predicted_finish_time', 'predicted_delay_hours', 'predicted_machine_down_risk', 'predicted_quality_risk', 'predicted_material_shortage_risk', 'prediction_confidence_score']
async function run() { await apiClient.post('/aips/predictions/run'); await load() }
async function load() { rows.value = (await apiClient.get('/aips/predictions/latest')).data }
onMounted(load)
</script>
