<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { GoogleLogin } from 'vue3-google-login'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致'
    return
  }

  isSubmitting.value = true

  const result = await authStore.register({
    name: name.value,
    email: email.value,
    password: password.value,
  })

  if (!result.success) {
    errorMessage.value = result.message || '註冊失敗，請稍後再試'
    isSubmitting.value = false
    return
  }

  successMessage.value = result.message || '註冊成功'

  window.setTimeout(() => {
    router.push('/login')
  }, 1000)
}

const handleGoogleLoginCallback = async (response) => {
  errorMessage.value = ''
  isSubmitting.value = true

  const googleIdToken = response?.credential || response?.access_token || response?.code

  if (!googleIdToken) {
    errorMessage.value = 'Google 認證失敗，未取得驗證憑證'
    isSubmitting.value = false
    return
  }

  try {
    const result = await authStore.loginWithGoogle(googleIdToken)
    isSubmitting.value = false

    if (result?.success) {
      router.push('/dashboard')
    } else {
      errorMessage.value = result?.message || 'Google 認證失敗'
    }
  } catch (err) {
    isSubmitting.value = false
    errorMessage.value = '伺服器連線失敗'
  }
}

const loginWithLine = () => {
  const clientID = import.meta.env.VITE_LINE_CHANNEL_ID
  const redirectURI = encodeURIComponent(import.meta.env.VITE_LINE_REDIRECT_URI)
  const state = 'pawpal_line_login_secure'

  const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientID}&redirect_uri=${redirectURI}&state=${state}&scope=profile%20openid%20email`

  window.location.href = lineAuthUrl
}
</script>

<template>
  <main class="login-form-page flex h-full items-start justify-center px-4 pt-8 pb-10">
    <form
      class="w-full max-w-[360px] rounded-[18px] bg-white px-8 py-7 shadow-[0_10px_35px_rgba(31,41,55,0.16)]"
      @submit.prevent="handleSubmit"
    >
      <header class="mb-7 flex flex-col items-center text-center">
        <h1 class="text-[22px] font-bold leading-tight text-brand-navy">建立新帳號</h1>
        <p class="mt-2 text-[13px] font-normal leading-relaxed text-brand-gray">
          加入 PawPal 開始記錄毛孩成長
        </p>
      </header>

      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-[13px] font-bold text-brand-navy">姓名</span>
          <input
            class="h-11 w-full rounded-xl border-0 bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none transition placeholder:text-brand-gray/50 focus:ring-2 focus:ring-brand-blue"
            type="text"
            placeholder="請輸入姓名"
            autocomplete="name"
            v-model="name"
            required
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-[13px] font-bold text-brand-navy">Email</span>
          <input
            class="h-11 w-full rounded-xl border-0 bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none transition placeholder:text-brand-gray/50 focus:ring-2 focus:ring-brand-blue"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            v-model="email"
            required
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-[13px] font-bold text-brand-navy">密碼</span>
          <input
            class="h-11 w-full rounded-xl border-0 bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none transition placeholder:text-brand-gray/50 focus:ring-2 focus:ring-brand-blue"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            v-model="password"
            required
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-[13px] font-bold text-brand-navy">再次確認密碼</span>
          <input
            class="h-11 w-full rounded-xl border-0 bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none transition placeholder:text-brand-gray/50 focus:ring-2 focus:ring-brand-blue"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            v-model="confirmPassword"
            required
          />
        </label>
      </div>

      <p v-if="errorMessage" class="mt-4 text-center text-sm font-medium text-red-500">
        {{ errorMessage }}
      </p>

      <p v-if="successMessage" class="mt-4 text-center text-sm font-medium text-green-600">
        {{ successMessage }}
      </p>

      <button
        class="mt-5 h-11 w-full rounded-xl bg-brand-orange text-[14px] font-bold text-brand-white shadow-[0_4px_18px_rgba(255,160,2,0.32)] transition hover:bg-[#e89000] focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 cursor-pointer"
        type="submit"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? '註冊中...' : '註冊' }}
      </button>

      <div class="my-6 flex items-center gap-3">
        <span class="h-px flex-1 bg-[#DDE5FC]"></span>
        <span class="text-[12px] font-medium text-brand-gray">或使用以下方式註冊</span>
        <span class="h-px flex-1 bg-[#DDE5FC]"></span>
      </div>

      <div class="w-full">
        <GoogleLogin
          :callback="handleGoogleLoginCallback"
          popup-type="TOKEN"
          v-slot="{ activate }"
          class="w-full"
        >
          <button
            class="flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-white text-[14px] font-semibold text-brand-navy shadow-[0_4px_14px_rgba(31,41,55,0.13)] ring-1 ring-[#DDE5FC] transition active:scale-[0.98] hover:bg-[#F3F4F8] cursor-pointer"
            type="button"
            @click="activate"
          >
            <img src="@/assets/icons/google.svg" alt="Google" class="w-5 h-5" />
            使用 Google 帳戶註冊
          </button>
        </GoogleLogin>

        <button
          class="flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-white text-[14px] font-semibold text-brand-navy shadow-[0_4px_14px_rgba(31,41,55,0.13)] ring-1 ring-[#DDE5FC] transition active:scale-[0.98] hover:bg-[#F3F4F8] cursor-pointer mt-3"
          type="button"
          @click="loginWithLine"
        >
          <img src="@/assets/icons/line.svg" alt="LINE" class="w-5 h-5" /> 使用 LINE 帳戶註冊
        </button>
      </div>

      <ul class="mt-7 flex items-center justify-center gap-1 text-[13px] font-bold">
        <li class="text-brand-gray">已經有帳號？</li>
        <li>
          <RouterLink
            class="text-brand-blue transition active:text-[#7F97EC] lg:hover:text-[#7F97EC]"
            to="/login"
            >立即登入</RouterLink
          >
        </li>
      </ul>
    </form>
  </main>
</template>
