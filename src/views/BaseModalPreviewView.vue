<script setup>
import { ref } from 'vue'
import AddPetModal from '@/components/pet/AddPetModal.vue'

const isOpen = ref(true)
</script>

<template>
  <main class="min-h-screen bg-brand-lightblue/40 p-6">
    <button
      type="button"
      class="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white"
      @click="isOpen = true"
    >
      開啟新增寵物
    </button>

    <AddPetModal :is-open="isOpen" @close="isOpen = false" @submit="isOpen = false" />
  </main>
</template>
