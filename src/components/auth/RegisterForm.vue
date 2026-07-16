<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session.js'
import { useAuthStore } from '@/stores/auth.js'
import { useToastStore } from '@/stores/toast'
import { googleTokenLogin } from 'vue3-google-login'
import TermsModal from '@/components/auth/TermsModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const sessionStore = useSessionStore()
const toastStore = useToastStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

const isModalOpen = ref(false)
const modalType = ref('privacy')

const handleOpenModal = (type) => {
  modalType.value = type
  isModalOpen.value = true
}

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致'
    toastStore.showToast(errorMessage.value, 'error')
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
    toastStore.showToast(errorMessage.value, 'error')
    isSubmitting.value = false
    return
  }

  successMessage.value = result.message || '註冊成功'

  toastStore.showToast('註冊成功！將轉至登入頁面 ', 'success')

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
    toastStore.showToast(errorMessage.value, 'error')
    isSubmitting.value = false
    return
  }

  try {
    const result = await sessionStore.loginWithGoogle(googleIdToken)
    isSubmitting.value = false

    if (result?.success) {
      toastStore.showToast('使用 Google 帳戶登入成功！', 'success')
      router.push('/dashboard')
    } else {
      errorMessage.value = result?.message || 'Google 認證失敗'
      toastStore.showToast(errorMessage.value, 'error')
    }
  } catch (err) {
    isSubmitting.value = false
    errorMessage.value = '伺服器連線失敗'
    toastStore.showToast(errorMessage.value, 'error')
  }
}

function handleGoogleAuthClick() {
  googleTokenLogin().then(handleGoogleLoginCallback).catch(() => {})
}

const loginWithLine = () => {
  const clientID = import.meta.env.VITE_LINE_CHANNEL_ID

  const currentOrigin = window.location.origin + '/login'
  const redirectURI = encodeURIComponent(currentOrigin)
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
        <button
          class="flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-white text-[14px] font-semibold text-brand-navy shadow-[0_4px_14px_rgba(31,41,55,0.13)] ring-1 ring-[#DDE5FC] transition active:scale-[0.98] hover:bg-[#F3F4F8] cursor-pointer"
          type="button"
          @click="handleGoogleAuthClick"
        >
          <img src="@/assets/icons/google.svg" alt="Google" class="w-5 h-5" />
          使用 Google 帳戶註冊
        </button>

        <button
          class="flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-white text-[14px] font-semibold text-brand-navy shadow-[0_4px_14px_rgba(31,41,55,0.13)] ring-1 ring-[#DDE5FC] transition active:scale-[0.98] hover:bg-[#F3F4F8] cursor-pointer mt-3"
          type="button"
          @click="loginWithLine"
        >
          <img src="@/assets/icons/line.svg" alt="LINE" class="w-5 h-5" /> 使用 LINE 帳戶註冊
        </button>
      </div>
      <p class="mt-6 text-center text-[11px] font-medium leading-relaxed text-brand-gray/75">
        點擊註冊，即表示您已閱讀並同意 PawPal 之
        <br />
        <button
          type="button"
          @click="handleOpenModal('terms')"
          class="text-brand-blue underline cursor-pointer hover:text-[#7F97EC]"
        >
          會員條款
        </button>
        與
        <button
          type="button"
          @click="handleOpenModal('privacy')"
          class="text-brand-blue underline cursor-pointer hover:text-[#7F97EC]"
        >
          客戶隱私權條款
        </button>
      </p>

      <ul class="mt-7 flex items-center justify-center gap-1 text-[13px] font-bold">
        <li class="text-brand-gray">已經有帳號？</li>
        <li>
          <RouterLink
            class="text-brand-orange transition active:text-[#E89000] lg:hover:text-[#E89000]"
            to="/login"
            >立即登入</RouterLink
          >
        </li>
      </ul>
    </form>
    <TermsModal :is-open="isModalOpen" :type="modalType" @close="isModalOpen = false" />
  </main>
</template>
