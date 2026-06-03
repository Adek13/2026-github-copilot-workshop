<template>
  <section>
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/purchase-orders" class="back-btn" title="Back to list">&#8592;</RouterLink>
        <div>
          <h2>Purchase Order Detail</h2>
          <p class="muted">{{ purchaseOrder?.poNumber || '-' }} &mdash; Purchase order information detail</p>
        </div>
      </div>
      <div class="btn-group" v-if="purchaseOrder">
        <button v-if="purchaseOrder.status === 'DRAFT'" class="btn btn-primary" @click="submitPO" :disabled="loading">
          {{ loading ? 'Submitting...' : 'Submit PO' }}
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success">{{ successMessage }}</p>

    <!-- PO Header card -->
    <div class="card-panel" v-if="purchaseOrder">
      <p class="form-section-title">PO Header</p>
      <div class="form-row">
        <div class="form-group">
          <label>PO Number</label>
          <input :value="purchaseOrder.poNumber" disabled />
        </div>
        <div class="form-group">
          <label>Vendor</label>
          <input :value="purchaseOrder.vendorName" disabled />
        </div>
        <div class="form-group">
          <label>Status</label>
          <span class="status-badge" :class="purchaseOrder.status.toLowerCase()">{{ purchaseOrder.status }}</span>
        </div>
        <div class="form-group">
          <label>Created</label>
          <input :value="purchaseOrder.createdAt ? new Date(purchaseOrder.createdAt).toLocaleString() : '-'" disabled />
        </div>
      </div>
    </div>

    <!-- PO Lines card -->
    <div class="card-panel" v-if="purchaseOrder && purchaseOrder.lines">
      <p class="form-section-title">PO Lines</p>
      <table>
        <thead>
          <tr>
            <th style="width:50px">Line</th>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Qty Ordered</th>
            <th>UOM</th>
            <th>Unit Price</th>
            <th>Site</th>
            <th>Allocated From</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in purchaseOrder.lines" :key="line.id">
            <td>{{ line.lineNo }}</td>
            <td>{{ line.itemCode }}</td>
            <td>{{ line.itemName }}</td>
            <td>{{ line.qtyOrdered }}</td>
            <td>{{ line.uom }}</td>
            <td>{{ line.unitPrice }}</td>
            <td>{{ line.siteCode }}</td>
            <td>
              <span v-for="alloc in line.allocations" :key="alloc.prLineId" class="badge">
                {{ alloc.prNumber }} ({{ alloc.allocatedQty }})
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { api } from '../api';

const route = useRoute();
const router = useRouter();
const purchaseOrder = ref(null);
const errorMessage = ref('');
const successMessage = ref('');
const loading = ref(false);

async function load() {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    purchaseOrder.value = await api.getPurchaseOrder(route.params.id);
  } catch (error) {
    errorMessage.value = error.message;
  }
}

async function submitPO() {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  
  try {
    purchaseOrder.value = await api.submitPurchaseOrder(route.params.id);
    successMessage.value = `PO ${purchaseOrder.value.poNumber} submitted successfully.`;
  } catch (error) {
    if (error.status === 422) {
      errorMessage.value = `Validation failed: ${error.message}`;
    } else {
      errorMessage.value = error.message || 'Failed to submit PO.';
    }
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.form-group input:disabled {
  background: var(--white);
  color: var(--text);
  cursor: default;
  opacity: 1;
}

.badge {
  display: inline-block;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  margin-right: 4px;
  margin-bottom: 4px;
}
</style>
