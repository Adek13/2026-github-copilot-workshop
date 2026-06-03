<template>
  <form class="po-header" @submit.prevent>
    <div class="grid">
      <div class="field">
        <label for="vendor">Vendor</label>
        <input
          id="vendor"
          v-model="local.vendor"
          type="text"
          placeholder="Type..."
        />
      </div>
      <div class="field">
        <label for="neededBy">Needed By date</label>
        <input
          id="neededBy"
          v-model="local.neededBy"
          type="date"
        />
      </div>
      <div class="field">
        <label for="currency">Currency</label>
        <input
          id="currency"
          v-model="local.currency"
          type="text"
        />
      </div>
      <div class="field">
        <label for="paymentTerms">Payment Terms</label>
        <input
          id="paymentTerms"
          v-model="local.paymentTerms"
          type="text"
          placeholder="Type..."
        />
      </div>
    </div>

    <div class="notes">
      <label for="notes">Notes</label>
      <textarea
        id="notes"
        v-model="local.notes"
        rows="4"
        placeholder="Type..."
      />
    </div>
  </form>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

// Local reactive copy prevents mutating parent directly
const local = reactive({ ...props.modelValue })

// Sync when parent updates
watch(
  () => props.modelValue,
  (newValue) => Object.assign(local, newValue),
  { deep: true }
)

// Emit updates to parent
watch(local, () => emit('update:modelValue', { ...local }), { deep: true })
</script>

<style scoped>
.po-header { display:flex; flex-direction:column; gap:24px }
.grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:24px }
.field { display:flex; flex-direction:column }
label { font-weight:400; margin-bottom:8px; font-size:13px; color: var(--grey) }
input, textarea { padding:10px 10px 10px 16px; border:1px solid var(--light-gray); border-radius: 5px; font-family: inherit; font-size:13px; color: var(--black) }
input { height: 45px; }
textarea { min-height: 71px; width: 100%; box-sizing: border-box; }
input::placeholder, textarea::placeholder { color: var(--text-muted) }
input:focus, textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(255, 64, 129, 0.1) }
.notes { display:flex; flex-direction:column; width: 100% }
</style>
