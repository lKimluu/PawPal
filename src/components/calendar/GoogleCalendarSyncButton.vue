<script setup>
import { onMounted } from 'vue'
import { googleSdkLoaded } from 'vue3-google-login'
import { useGoogleCalendarStore } from '@/stores/googleCalendar.js'
import { useToastStore } from '@/stores/toast.js'

const googleCalendarStore = useGoogleCalendarStore()
const toastStore = useToastStore()

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

onMounted(() => {
  googleCalendarStore.fetchStatus()
})

// vue3-google-login 寫死 scope，無法要求行事曆權限，需直接用 Google SDK 開授權彈窗
function openGoogleAuthPopup() {
  googleSdkLoaded((google) => {
    google.accounts.oauth2
      .initCodeClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: CALENDAR_SCOPE,
        ux_mode: 'popup',
        callback: (response) => {
          if (response.code) {
            handleConnect(response.code)
          }
        },
        error_callback: () => {
          // 使用者關閉授權彈窗屬主動取消，不顯示錯誤
        },
      })
      .requestCode()
  })
}

async function handleConnect(code) {
  const result = await googleCalendarStore.connect(code)

  if (result.success) {
    toastStore.showToast(result.message || 'Google 行事曆連接成功')
  } else {
    toastStore.showToast(result.message || 'Google 行事曆連接失敗', 'error')
  }
}

async function handleDisconnect() {
  const result = await googleCalendarStore.disconnect()

  if (result.success) {
    toastStore.showToast(result.message || '已中斷 Google 行事曆連接')
  } else {
    toastStore.showToast(result.message || '中斷連接失敗，請稍後再試', 'error')
  }
}
</script>

<template>
  <div class="flex items-center gap-3">
    <template v-if="googleCalendarStore.isConnected">
      <span class="flex items-center gap-2 text-[13px] font-medium text-brand-gray">
        <span class="h-2 w-2 rounded-full bg-green-500"></span>
        已連接 Google 行事曆
      </span>
      <button
        class="text-[13px] font-medium text-brand-gray underline transition hover:text-brand-orange disabled:opacity-50 cursor-pointer"
        type="button"
        :disabled="googleCalendarStore.isLoading"
        @click="handleDisconnect"
      >
        中斷連接
      </button>
    </template>

    <button
      v-else
      class="flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-[13px] font-semibold text-brand-navy shadow-[0_4px_14px_rgba(31,41,55,0.13)] ring-1 ring-[#DDE5FC] transition hover:bg-[#F3F4F8] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
      type="button"
      :disabled="googleCalendarStore.isLoading"
      @click="openGoogleAuthPopup"
    >
      <img src="@/assets/icons/google.svg" alt="Google" class="h-4 w-4" />
      連接 Google 行事曆
    </button>
  </div>
</template>
