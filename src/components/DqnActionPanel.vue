<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">DQN 排程建議</h1>
        <p class="page-subtitle">顯示 AI 對製令單、CNC 機台與線邊庫狀況所產生的排程建議。</p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="generate">產生 DQN 建議</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="card">
      <DataTable :columns="columns" :rows="rows" :labels="labels" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const rows = ref([])

const columns = [
  'action_id',
  'action_time',
  'action_name',
  'work_order_no',
  'original_cnc_machine_id',
  'replenishment_required_flag',
  'maintenance_check_required_flag',
  'expected_delay_reduction_hours',
  'expected_oee_improvement_rate',
  'action_confidence_score',
  'action_status',
  'action_reason'
]

const labels = {
  action_id: '編號',
  action_time: '建議時間',
  action_name: '建議動作',
  work_order_no: '製令單',
  original_cnc_machine_id: '原機台',
  replenishment_required_flag: '是否需補料',
  maintenance_check_required_flag: '是否需保養',
  expected_delay_reduction_hours: '預估降低延遲時數',
  expected_oee_improvement_rate: '預估 OEE 改善',
  action_confidence_score: '信心分數',
  action_status: '狀態',
  action_reason: '建議原因'
}

async function generate() {
  await apiClient.post('/aips/dqn/generate-actions')
  await load()
}

async function load() {
  rows.value = (await apiClient.get('/aips/dqn/actions/latest')).data
}

onMounted(load)
</script>
