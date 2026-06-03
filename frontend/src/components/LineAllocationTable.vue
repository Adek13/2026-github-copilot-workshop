<template>
  <div class="line-table">
    <table>
      <thead>
        <tr>
          <th>Select</th>
          <th>PR No</th>
          <th>PR Line</th>
          <th>Item Code</th>
          <th>Item Name</th>
          <th>UOM</th>
          <th>Requested QTY</th>
          <th>Allocated QTY</th>
          <th>Remaining QTY</th>
          <th>Order QTY</th>
          <th>Delivery Address</th>
          <th>Delivery Date</th>
          <th>Unit Price</th>
          <th>Line Ammount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(line, idx) in localLines" :key="line.id">
          <td>
            <input
              v-model="line.selected"
              type="checkbox"
              :aria-label="`Select ${line.itemName}`"
            />
          </td>
          <td>{{ line.prNo }}</td>
          <td>{{ line.prLine }}</td>
          <td>{{ line.itemCode }}</td>
          <td>{{ line.itemName }}</td>
          <td>{{ line.uom }}</td>
          <td>{{ line.requestedQty }}</td>
          <td>{{ line.allocatedQty }}</td>
          <td>{{ line.remainingQty }}</td>
          <td>
            <input
              v-model.number="line.orderQty"
              type="number"
              min="0"
              :max="line.remainingQty"
              :aria-label="`Order quantity for ${line.itemName}`"
            />
          </td>
          <td>
            <input
              v-model="line.deliveryAddress"
              type="text"
              placeholder="Type..."
              :aria-label="`Delivery address for ${line.itemName}`"
            />
          </td>
          <td>
            <input
              v-model="line.deliveryDate"
              type="date"
              :aria-label="`Delivery date for ${line.itemName}`"
            />
          </td>
          <td>
            <input
              v-model.number="line.unitPrice"
              type="number"
              min="0"
              :aria-label="`Unit price for ${line.itemName}`"
            />
          </td>
          <td class="amount">
            {{ formatCurrency(lineAmount(line)) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  lines: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(['update:lines'])

// Local reactive copy of lines - prevents accidental parent mutations
const localLines = reactive(
  props.lines.map(l => ({
    ...l,
    orderQty: l.orderQty || 0,
    selected: l.selected ?? false,
    unitPrice: l.unitPrice || 0
  }))
)

// Sync when parent updates lines
watch(
  () => props.lines,
  (newLines) => {
    localLines.splice(0, localLines.length, ...newLines.map(x => ({ ...x })))
  },
  { deep: true }
)

// Emit updates to parent when local lines change
watch(
  () => localLines.map(l => ({ ...l })),
  () => emit('update:lines', localLines.map(l => ({ ...l }))),
  { deep: true }
)

// Utility: calculate line amount (orderQty * unitPrice)
const lineAmount = (line) => {
  return (Number(line.orderQty) || 0) * (Number(line.unitPrice) || 0)
}

// Utility: format currency to Indonesian locale
const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID').format(value)
}
</script>

<style scoped>
.line-table { overflow-x: auto; border-radius: 10px; }
.line-table table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.line-table th {
  background: var(--table-header);
  padding: 8px 10px;
  border-bottom: 1px solid #ddd;
  text-align: left;
  vertical-align: middle;
  font-weight: 600;
  font-size: 14px;
  color: var(--black);
  line-height: 1.2;
}
.line-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #ddd;
  text-align: left;
  vertical-align: middle;
  font-size: 13px;
  color: var(--black);
  height: 54px;
}
.line-table input[type="number"],
.line-table input[type="text"],
.line-table input[type="date"] {
  height: 45px;
  padding: 10px 10px 10px 16px;
  border: 1px solid var(--light-gray);
  border-radius: 5px;
  width: 100%;
  font-size: 13px;
  font-family: inherit;
}
.line-table input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary);
}
.amount { text-align: right; font-weight: 400; }
</style>
