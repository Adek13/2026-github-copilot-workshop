<template>
  <div class="line-table">
    <table>
      <thead>
        <tr>
          <th>PR Line</th>
          <th>Item</th>
          <th>Remaining Qty</th>
          <th>Allocate Qty</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(line, idx) in localLines" :key="line.id">
          <td>{{ line.prLine }}</td>
          <td>{{ line.item }}</td>
          <td>{{ line.remaining }}</td>
          <td>
            <input
              type="number"
              min="0"
              :max="line.remaining"
              v-model.number="line.allocate"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  lines: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:lines'])

const localLines = reactive(props.lines.map(l => ({ ...l, allocate: l.allocate || 0 })))

watch(
  () => localLines.map(l => l.allocate),
  () => emit('update:lines', localLines.map(l => ({ ...l })))
)
</script>

<style scoped>
.line-table table { width: 100%; border-collapse: collapse; }
.line-table th, .line-table td { padding: 8px; border: 1px solid #eee; text-align: left; }
input[type="number"] { width: 120px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; }
</style>
