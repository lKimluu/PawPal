<script setup>
import ToastNotification from '@/components/common/ToastNotification.vue'
import AiAssistantPanel from '@/components/ai/AiAssistantPanel.vue'
</script>

<template>
  <router-view />

  <!-- 吐司提示 -->
  <ToastNotification />
  <AiAssistantPanel />
</template>

<style scoped></style>
