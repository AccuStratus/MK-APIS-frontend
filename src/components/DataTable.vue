<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col">{{ label(col) }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length">目前沒有資料</td>
        </tr>
        <tr v-for="(row, idx) in rows" :key="idx">
          <td v-for="col in columns" :key="col">{{ formatValue(row[col]) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  labels: { type: Object, default: () => ({}) }
})

function label(col) {
  return props.labels[col] || col
}

function formatValue(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return Number.isInteger(value) ? value : value.toFixed(4)
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'object') return JSON.stringify(value)
  return value
}
</script>
