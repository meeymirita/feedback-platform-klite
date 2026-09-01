<script setup lang="ts">
// Каркас страниц кабинета: сайдбар + текущая вложенная страница в <RouterView />.
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
</script>

<template>
  <div class="flex min-h-screen bg-[#f5f6f8] font-sans text-ink">
    <AppSidebar />
    <RouterView />
  </div>
</template>
