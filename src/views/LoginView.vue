<script setup>
import { useRouter } from 'vue-router'
import Header from '@/components/layout/AppHeader.vue'
import Footer from '@/components/layout/AppFooter.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import { useSessionStore } from '@/stores/session.js'

const router = useRouter()
const sessionStore = useSessionStore()

async function handleLogin(payload) {
  const result = await sessionStore.login(payload.email, payload.password)
  if (result.success) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col pt-[55px] lg:pt-[68px]">
    <Header variant="public" />
    <LoginForm class="flex-1" @login="handleLogin" />
    <Footer />
  </div>
</template>
