<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">WMS 線邊庫</h1>
        <p class="page-subtitle">
          用來模擬 WMS 線邊庫即時庫存，AIPS 會依照可用量與安全庫存判斷缺料風險。
        </p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="create">新增庫存快照</button>
        <button @click="load">重新整理</button>
      </div>
    </div>

    <div class="card">
      <h2>新增線邊庫資料</h2>

      <div class="form-grid">
        <label>
          CNC 機台
          <input v-model="form.cnc_machine_id" />
        </label>

        <label>
          線邊庫位
          <input v-model="form.line_side_location_id" />
        </label>

        <label>
          物料料號
          <input v-model="form.material_no" />
        </label>

        <label>
          物料名稱
          <input v-model="form.material_name" />
        </label>

        <label>
          批號
          <input v-model="form.lot_no" />
        </label>

        <label>
          目前數量
          <input v-model.number="form.current_qty" type="number" />
        </label>

        <label>
          保留數量
          <input v-model.number="form.reserved_qty" type="number" />
        </label>

        <label>
          安全庫存
          <input v-model.number="form.safety_stock_qty" type="number" />
        </label>
      </div>

      <div class="stock-summary">
        <div class="stock-box">
          <span>可用量</span>
          <strong>{{ availableQty }}</strong>
        </div>
        <div class="stock-box">
          <span>安全庫存</span>
          <strong>{{ form.safety_stock_qty }}</strong>
        </div>
        <div class="stock-box" :class="{ danger: shortageQty > 0 }">
          <span>缺料量</span>
          <strong>{{ shortageQty }}</strong>
        </div>
        <div class="stock-box" :class="{ danger: shortageQty > 0, success: shortageQty <= 0 }">
          <span>AI 判斷</span>
          <strong>{{ shortageQty > 0 ? '需提前補料' : '庫存充足' }}</strong>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>線邊庫清單</h2>
      <DataTable :columns="columns" :rows="rows" :labels="labels" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const form = ref({
  cnc_machine_id: 'CNC-01',
  line_side_location_id: 'LS-CNC-01',
  material_no: 'MAT-AL-6061',
  material_name: '鋁棒 6061',
  lot_no: 'LOT-001',
  current_qty: 50,
  reserved_qty: 10,
  safety_stock_qty: 30
})

const rows = ref([])

const columns = [
  'snapshot_id',
  'snapshot_time',
  'cnc_machine_id',
  'material_no',
  'material_name',
  'current_qty',
  'reserved_qty',
  'available_qty',
  'safety_stock_qty',
  'shortage_flag',
  'shortage_qty'
]

const labels = {
  snapshot_id: '編號',
  snapshot_time: '快照時間',
  cnc_machine_id: 'CNC 機台',
  material_no: '物料料號',
  material_name: '物料名稱',
  current_qty: '目前數量',
  reserved_qty: '保留數量',
  available_qty: '可用量',
  safety_stock_qty: '安全庫存',
  shortage_flag: '是否缺料',
  shortage_qty: '缺料量'
}

const availableQty = computed(() => Number(form.value.current_qty || 0) - Number(form.value.reserved_qty || 0))
const shortageQty = computed(() => Math.max(Number(form.value.safety_stock_qty || 0) - availableQty.value, 0))

async function create() {
  await apiClient.post('/inventory/snapshots', form.value)
  await load()
}

async function load() {
  rows.value = (await apiClient.get('/inventory/snapshots/latest')).data
}

onMounted(load)
</script>
