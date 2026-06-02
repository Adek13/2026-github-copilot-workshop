<template>
  <div class="po-create-page">
    <h1>Create Purchase Order</h1>

    <HeaderForm v-model="form" />

    <h2>Line Allocations</h2>
    <LineAllocationTable :lines="lines" @update:lines="(v) => (lines = v)" />

    <div class="actions">
      <button @click="handleSubmit">Save (no API)</button>
    </div>

    <pre class="debug">{{ debug }}</pre>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import HeaderForm from '../components/HeaderForm.vue'
import LineAllocationTable from '../components/LineAllocationTable.vue'

const form = reactive({ poNumber: '', supplier: '', date: '', notes: '' })

let lines = ref([
  { id: 1, prLine: 'PR-1', item: 'Pens', remaining: 100, allocate: 0 },
  { id: 2, prLine: 'PR-2', item: 'Notebooks', remaining: 50, allocate: 0 }
])

const debug = computed(() => ({ form: { ...form }, lines: lines.value }))

function handleSubmit() {
  // no API calls yet — just validate simple allocation rule
  const over = lines.value.find(l => l.allocate > l.remaining)
  if (over) return alert(`Allocation for ${over.item} exceeds remaining qty`)

  // simple console log for now
  console.log('PO payload', { form: { ...form }, lines: lines.value })
  alert('PO saved locally (no API) — check console')
}
</script>

<style scoped>
.po-create-page { padding: 16px; max-width: 900px; }
.actions { margin-top: 16px; }
button { padding: 10px 14px; border: none; background: #2563eb; color: white; border-radius: 6px; }
.debug { margin-top: 16px; background: #f8f8f8; padding: 12px; border-radius: 6px; }
</style>
