<template>
  <div class="page">
    <h1>DQN State 狀態特徵</h1>
    <div class="toolbar"><button @click="run">建立 DQN State</button><button @click="load">重新整理</button></div>
    <div class="card"><DataTable :columns="columns" :rows="rows" /></div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'
const rows = ref([])
const columns = ['state_id', 'state_time', 'work_order_no', 'cnc_machine_id', 'machine_status', 'line_side_material_available_flag', 'line_side_shortage_qty', 'delay_risk_score', 'shortage_risk_score', 'quality_risk_score', 'current_oee']
async function run() { await apiClient.post('/aips/states/build'); await load() }
async function load() { rows.value = (await apiClient.get('/aips/states/latest')).data }
onMounted(load)
</script>
