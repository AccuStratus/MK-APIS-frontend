<template>
  <div class="page">
    <h1>DQN Reward 回饋</h1>
    <div class="toolbar"><button @click="run">計算 Reward</button><button @click="load">重新整理</button></div>
    <div class="card"><DataTable :columns="columns" :rows="rows" /></div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'
const rows = ref([])
const columns = ['reward_id', 'action_id', 'evaluate_time', 'work_order_no', 'cnc_machine_id', 'delay_hours', 'shortage_occurred_flag', 'machine_down_occurred_flag', 'actual_yield_rate', 'actual_oee', 'energy_kwh', 'total_reward_score']
async function run() { await apiClient.post('/aips/rewards/calculate'); await load() }
async function load() { rows.value = (await apiClient.get('/aips/rewards/latest')).data }
onMounted(load)
</script>
