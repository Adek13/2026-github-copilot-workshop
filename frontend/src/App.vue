<template>
  <div class="layout">
    <header class="navbar" :class="{ 'navbar-po': isPOCreate }">
      <template v-if="isPOCreate">
        <div class="navbar-logo" aria-label="Anteraja logo">anteraja</div>
      </template>
      <template v-else>
        <span class="navbar-brand">Procurement MVP</span>
        <nav>
          <RouterLink to="/" :class="{ active: isDashboard }">Dashboard</RouterLink>
          <RouterLink to="/requisitions" :class="{ active: isRequisitions }">Purchase Requisitions</RouterLink>
          <RouterLink to="/purchase-orders" :class="{ active: isPurchaseOrders }">Purchase Orders</RouterLink>
        </nav>
      </template>
    </header>

    <main class="content" :class="{ 'content-po': isPOCreate }">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

const route = useRoute();
const isDashboard = computed(() => route.path === '/');
const isRequisitions = computed(() => route.path.startsWith('/requisitions'));
const isPurchaseOrders = computed(() => route.path.startsWith('/purchase-orders'));
const isPOCreate = computed(() => route.path === '/purchase-orders/new');
</script>
