<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { TERMS_OF_SERVICE } from '@/constants/legalContent.js'
</script>

<template>
  <AppHeader variant="public" />
  <main class="min-h-screen bg-brand-white px-4 pb-16 pt-24 md:pt-28">
    <div class="mx-auto w-full max-w-3xl rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(61,74,122,0.08)] md:p-10">
      <h1 class="text-xl font-bold tracking-wide text-brand-navy md:text-2xl">
        {{ TERMS_OF_SERVICE.title }}
      </h1>
      <div
        class="mt-6 whitespace-pre-line text-sm leading-relaxed text-brand-darkgray"
      >
        {{ TERMS_OF_SERVICE.content }}
      </div>
    </div>
  </main>
  <AppFooter />
</template>
