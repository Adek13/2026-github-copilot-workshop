<template>
  <div class="po-create-page">
    <header class="po-header-top">
      <div class="po-header-left">
        <button class="btn-back" @click="goBack">←</button>
        <div>
          <h1 class="po-title">Create Purchase Order</h1>
          <p class="po-subtitle">Pick approved PR lines and allocate order quantities</p>
        </div>
      </div>
    </header>

    <p v-if="errorMessage" class="po-message po-message-error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="po-message po-message-success">{{ successMessage }}</p>

    <section class="po-card">
      <h2 class="po-card-title">PO Header</h2>
      <HeaderForm v-model="form" />
    </section>

    <section class="po-card">
      <div class="po-section-header">
        <h2 class="po-card-title">Approved PR Lines</h2>
        <button class="btn-refresh" :disabled="loading" @click="refreshOpenLines">
          {{ loading ? 'Refreshing...' : 'Refresh Open Lines' }}
        </button>
      </div>
      <LineAllocationTable :lines="lines" @update:lines="updateLines" />
    </section>

    <section class="po-summary">
      <div class="summary-block">
        <div class="summary-label">Selected Lines</div>
        <div class="summary-value">{{ selectedCount }}</div>
      </div>
      <div class="summary-block">
        <div class="summary-label">Estimated Total</div>
        <div class="summary-value">{{ formattedTotal }}</div>
      </div>
    </section>

    <footer class="po-actions">
      <button class="btn btn-secondary" :disabled="loading" @click="saveDraft">Save As Draft</button>
      <button class="btn btn-primary" :disabled="loading" @click="submitPO">Submit PO</button>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import HeaderForm from '../components/HeaderForm.vue'
import LineAllocationTable from '../components/LineAllocationTable.vue'
import { api } from '../api'

const router = useRouter()

// Form state - PO header fields
const form = reactive({
  vendor: '',
  neededBy: '',
  currency: 'IDR',
  paymentTerms: '',
  notes: ''
})

// Lines state - Approved PR lines available for allocation
const lines = ref([
  {
    id: 1,
    prLineId: 'local-1',
    selected: true,
    prNo: 'PR-001',
    prLine: 1,
    itemCode: 'ITEM-001',
    itemName: 'Bearing-6205',
    uom: 'PCS',
    requestedQty: 20,
    allocatedQty: 5,
    remainingQty: 15,
    orderQty: 10,
    deliveryAddress: '',
    deliveryDate: '',
    unitPrice: 150000,
    siteCode: 'WH-JKT',
    requiredDate: null,
  },
  {
    id: 2,
    prLineId: 'local-2',
    selected: true,
    prNo: 'PR-001',
    prLine: 2,
    itemCode: 'ITEM-009',
    itemName: 'Grease High Temp',
    uom: 'TUBE',
    requestedQty: 12,
    allocatedQty: 0,
    remainingQty: 12,
    orderQty: 0,
    deliveryAddress: '',
    deliveryDate: '',
    unitPrice: 0,
    siteCode: 'WH-JKT',
    requiredDate: null,
  },
  {
    id: 3,
    prLineId: 'local-3',
    selected: true,
    prNo: 'PR-004',
    prLine: 1,
    itemCode: 'ITEM-015',
    itemName: 'Bearing-6205',
    uom: 'PAIR',
    requestedQty: 50,
    allocatedQty: 10,
    remainingQty: 40,
    orderQty: 20,
    deliveryAddress: '',
    deliveryDate: '',
    unitPrice: 32000,
    siteCode: 'WH-JKT',
    requiredDate: null,
  }
])

const loading = ref(false)
const currentPoId = ref(null)
const errorMessage = ref('')
const successMessage = ref('')

// Update lines from child component
const updateLines = (updatedLines) => {
  currentPoId.value = null
  lines.value = updatedLines
}

// Navigate back to PO list
const goBack = () => {
  router.push('/purchase-orders')
}

// Computed: count selected lines
const selectedCount = computed(() => lines.value.filter(l => l.selected).length)

// Computed: calculate total order amount
const estimatedTotal = computed(() => {
  return lines.value.reduce((sum, line) => {
    return sum + (Number(line.orderQty) || 0) * (Number(line.unitPrice) || 0)
  }, 0)
})

// Computed: format total as Indonesian locale currency
const formattedTotal = computed(() => {
  return new Intl.NumberFormat('id-ID').format(estimatedTotal.value)
})

// Action: Refresh available open PR lines (stub - no API yet)
const refreshOpenLines = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const requisitions = await api.listRequisitions()
    const approved = (requisitions.items || []).filter((item) => item.status === 'APPROVED')

    const openLinePayloads = await Promise.all(
      approved.map((item) => api.getRequisitionOpenLines(item.id).catch(() => null))
    )

    const mapped = []
    for (const payload of openLinePayloads) {
      if (!payload || !payload.openLines || !payload.requisition) continue

      for (const line of payload.openLines) {
        mapped.push({
          id: line.id,
          prLineId: line.id,
          selected: true,
          prNo: payload.requisition.prNumber,
          prLine: line.lineNo,
          itemCode: line.itemCode,
          itemName: line.itemName,
          uom: line.uom,
          requestedQty: line.qtyRequested,
          allocatedQty: line.qtyAllocated,
          remainingQty: line.qtyOpenForPo,
          orderQty: 0,
          deliveryAddress: '',
          deliveryDate: line.requiredDate || '',
          unitPrice: line.estUnitPrice || 0,
          siteCode: line.siteCode,
          requiredDate: line.requiredDate || null,
        })
      }
    }

    if (mapped.length === 0) {
      errorMessage.value = 'No approved PR open lines found.'
      return
    }

    lines.value = mapped
    currentPoId.value = null
    successMessage.value = `Loaded ${mapped.length} approved PR open lines.`
  } catch (error) {
    errorMessage.value = error.message || 'Failed to refresh open lines.'
  } finally {
    loading.value = false
  }
}

function buildCreatePayload() {
  if (!form.vendor || !form.vendor.trim()) {
    const err = new Error('vendorName is required')
    err.status = 422
    throw err
  }

  const selectedLines = lines.value.filter((line) => line.selected && Number(line.orderQty) > 0)
  if (selectedLines.length === 0) {
    const err = new Error('Select at least one line with order quantity greater than 0')
    err.status = 422
    throw err
  }

  const overAllocated = selectedLines.find((line) => Number(line.orderQty) > Number(line.remainingQty))
  if (overAllocated) {
    const err = new Error(
      `allocation qty ${overAllocated.orderQty} exceeds remaining ${overAllocated.remainingQty} for ${overAllocated.itemCode}`
    )
    err.status = 422
    throw err
  }

  return {
    vendorName: form.vendor.trim(),
    lines: selectedLines.map((line) => ({
      prLineId: line.prLineId,
      itemCode: line.itemCode,
      itemName: line.itemName,
      qtyOrdered: Number(line.orderQty),
      unitPrice: Number(line.unitPrice || 0),
      uom: line.uom,
      siteCode: line.siteCode,
      requiredDate: line.deliveryDate || line.requiredDate || null,
    })),
  }
}

// Action: Save PO as draft (stub - no API yet)
const saveDraft = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = buildCreatePayload()
    const purchaseOrder = await api.createPurchaseOrder(payload)
    currentPoId.value = purchaseOrder.id
    successMessage.value = `PO ${purchaseOrder.poNumber} saved as DRAFT.`
  } catch (error) {
    if (error.status === 422) {
      errorMessage.value = `Validation failed: ${error.message}`
    } else {
      errorMessage.value = error.message || 'Failed to save PO draft.'
    }
  } finally {
    loading.value = false
  }
}

// Action: Submit PO (stub - no API yet)
const submitPO = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    let poId = currentPoId.value
    if (!poId) {
      const payload = buildCreatePayload()
      const draft = await api.createPurchaseOrder(payload)
      poId = draft.id
      currentPoId.value = poId
    }

    const submitted = await api.submitPurchaseOrder(poId)
    successMessage.value = `PO ${submitted.poNumber} submitted successfully.`
  } catch (error) {
    if (error.status === 422) {
      errorMessage.value = `Validation failed: ${error.message}`
    } else {
      errorMessage.value = error.message || 'Failed to submit PO.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await refreshOpenLines()
})
</script>

<style scoped>
.po-create-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1366px;
  padding: 0 40px;
  margin: 32px auto 40px;
}

.po-header-top { 
  display: flex; 
  align-items: flex-start; 
  padding: 0; 
}

.po-header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.btn-back {
  background: var(--primary);
  color: var(--white);
  border: 0;
  width: 45px;
  height: 45px;
  border-radius: 30px;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 2px;
}

.btn-back:hover {
  background: var(--primary-hover);
}

.po-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.po-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin: 8px 0 0;
}

.po-card {
  background: var(--white);
  border-radius: var(--radius-card);
  padding: 24px;
}

.po-card-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--text);
}

.po-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.btn-refresh {
  background: var(--white);
  border: 1px solid var(--primary);
  color: var(--text);
  height: 45px;
  padding: 0 24px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-refresh:hover {
  background: rgba(255, 64, 129, 0.08);
}

.po-summary {
  background: var(--white);
  border-radius: var(--radius-card);
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-block {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.summary-value {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -1.6px;
  color: var(--text);
}

.po-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  height: 45px;
  padding: 0 24px;
  border-radius: 30px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary);
  color: var(--white);
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--secondary);
  color: var(--white);
}

.btn-secondary:hover {
  background: var(--secondary-hover);
}

.btn:disabled,
.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.po-message {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
}

.po-message-error {
  background: #fff0f3;
  color: #b00020;
  border: 1px solid #ffd3de;
}

.po-message-success {
  background: #f0fff5;
  color: #136c3c;
  border: 1px solid #c8f1da;
}
</style>
