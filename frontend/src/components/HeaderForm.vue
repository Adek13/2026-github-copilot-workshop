<template>
  <form class="po-header" @submit.prevent>
    <div class="row">
      <label>PO Number</label>
      <input type="text" v-model="local.value.poNumber" />
    </div>

    <div class="row">
      <label>Supplier</label>
      <input type="text" v-model="local.value.supplier" />
    </div>

    <div class="row">
      <label>Date</label>
      <input type="date" v-model="local.value.date" />
    </div>

    <div class="row notes">
      <label>Notes</label>
      <textarea v-model="local.value.notes" rows="3" />
    </div>
  </form>
</template>

<script setup>
import { toRef, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Object, required: true }
})
const emit = defineEmits(['update:modelValue'])

// keep a local reactive copy to avoid mutating parent directly
const local = reactive({ value: { ...props.modelValue } })

watch(
  () => props.modelValue,
  (v) => Object.assign(local.value, v),
  { deep: true }
)

watch(local, () => emit('update:modelValue', { ...local.value }), { deep: true })
</script>

<style scoped>
.po-header { display: grid; gap: 8px; max-width: 760px; }
.row { display: flex; flex-direction: column; }
label { font-weight: 600; margin-bottom: 4px; }
input, textarea { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
.notes textarea { min-height: 64px; }
</style>
