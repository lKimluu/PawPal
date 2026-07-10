<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PublicSidebar from '@/components/layout/PublicSidebar.vue'
import DashboardSidebar from '@/components/layout/DashboardSidebar.vue'
import { useAuthStore } from '@/stores/auth'
import { useMedicalStore } from '@/stores/medical.js'
import { useSidebarStore } from '@/stores/sidebar'
import {
  getUserAvatarUrl,
  getUserDisplayEmail,
  getUserDisplayName,
  hasUserAvatar,
} from '@/utils/userProfile.js'
import defaultProfileIcon from '@/assets/icons/account-profile-icon.svg'

const props = defineProps({
  variant: {
    type: String,
    default: 'public',
    validator: (value) => ['public', 'member'].includes(value),
  },
})

const sidebarStore = useSidebarStore()
const authStore = useAuthStore()
const medicalStore = useMedicalStore()
const router = useRouter()
const memberMenuRef = ref(null)
const isMemberMenuOpen = ref(false)

const isMemberVariant = computed(() => props.variant === 'member')
const shouldUseMemberSidebarOnMobile = computed(() => authStore.isLoggedIn)
const memberAvatarUrl = computed(() => getUserAvatarUrl(authStore.user))
const hasUploadedAvatar = computed(() => hasUserAvatar(authStore.user))
const memberDisplayName = computed(() => getUserDisplayName(authStore.user))
const memberDisplayEmail = computed(() => getUserDisplayEmail(authStore.user))

function toggleMemberMenu() {
  isMemberMenuOpen.value = !isMemberMenuOpen.value
}

function closeMemberMenu() {
  isMemberMenuOpen.value = false
}

function handleDocumentClick(event) {
  if (!memberMenuRef.value?.contains(event.target)) {
    closeMemberMenu()
  }
}

function handleLogout() {
  authStore.logout()
  medicalStore.reset()
  sidebarStore.closeSidebar()
  closeMemberMenu()
  router.push('/login')
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

const navGroups = [
  {
    id: 'medical',
    label: '醫療專區',
    items: [
      { label: '搜尋醫療院所', to: '/hospital' },
      { label: '線上看診', href: '#' },
      { label: '緊急處置教學', href: '#' },
    ],
  },
  {
    id: 'knowledge',
    label: '寵物知識+',
    items: [
      { label: '經驗分享討論區', href: '#' },
      { label: '衛教文章', href: '#' },
      { label: '小知識測驗', href: '#' },
    ],
  },
]
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 bg-white shadow-sm">
    <!-- 手機版與平板版 -->
    <div class="lg:hidden">
      <div class="mx-auto flex h-[55px] items-center justify-between px-4">
        <RouterLink to="/" class="items-center">
          <img src="@/assets/images/PawPal_logo.PNG" alt="logo" class="h-10 w-auto md:h-8" />
        </RouterLink>

        <button
          type="button"
          class="flex h-10 w-10 items-center justify-end"
          @click="sidebarStore.toggleSidebar()"
        >
          <img src="@/assets/icons/header-bars.svg" alt="menu" class="h-8 w-8 object-contain" />
        </button>
      </div>
    </div>

    <!-- 電腦版 -->
    <div class="mx-auto hidden h-17 items-center px-4 lg:flex lg:justify-between">
      <RouterLink to="/" class="flex items-center pl-4">
        <img src="@/assets/images/PawPal_logo.PNG" alt="logo" class="h-12 w-auto" />
      </RouterLink>

      <div class="flex items-center gap-5 lg:contents">
        <nav class="flex items-center gap-5 lg:gap-16 text-brand-gray">
          <a href="#" class="transition hover:text-[#FFA002]">關於我們</a>

          <div v-for="group in navGroups" :key="group.id" class="group relative">
            <button
              type="button"
              class="group flex cursor-pointer items-center gap-1 transition group-hover:text-brand-orange"
            >
              <span>{{ group.label }}</span>
              <img
                src="@/assets/icons/angle-arrow.svg"
                alt="angle-arrow"
                class="size-4 arrow-icon transition duration-150"
              />
            </button>

            <div
              class="invisible absolute left-0 z-50 mt-2 w-40 rounded-lg bg-white py-2 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100"
            >
              <template v-for="item in group.items" :key="item.label">
                <RouterLink
                  v-if="item.to"
                  :to="item.to"
                  class="block px-4 py-2 transition hover:bg-brand-lightblue hover:text-brand-darkgray"
                >
                  {{ item.label }}
                </RouterLink>
                <a
                  v-else
                  :href="item.href"
                  class="block px-4 py-2 transition hover:bg-brand-lightblue hover:text-brand-darkgray"
                >
                  {{ item.label }}
                </a>
              </template>
            </div>
          </div>

          <a
            v-if="authStore.isLoggedIn"
            href="#"
            class="transition hover:text-brand-orange"
            >會員專區</a
          >
        </nav>

        <div class="flex items-center gap-2">
          <RouterLink
            to="/hospital"
            class="flex items-center justify-center rounded-full bg-brand-orange px-4 py-2 text-white transition hover:bg-[#e58f04]"
          >
            <img src="@/assets/icons/location.svg" class="size-5" />
            搜尋附近醫院
          </RouterLink>

          <span class="ml-2 mr-0 h-8 w-px bg-[#D9DEE8]" aria-hidden="true" />

          <RouterLink
            v-if="!authStore.isLoggedIn"
            to="/login"
            class="group flex h-12 items-center justify-center gap-2 rounded-full py-2 pl-2 pr-3 text-base font-medium text-brand-gray transition hover:text-brand-orange"
          >
            <svg
              class="login-icon size-6 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>登入</span>
          </RouterLink>

          <div v-else ref="memberMenuRef" class="relative">
            <button
              type="button"
              class="grid size-11 place-items-center rounded-full border border-[#D6DDE8] bg-white transition hover:border-brand-orange"
              aria-label="開啟會員選單"
              :aria-expanded="isMemberMenuOpen"
              @click.stop="toggleMemberMenu"
            >
              <img
                v-if="hasUploadedAvatar"
                :src="memberAvatarUrl"
                alt="會員頭像"
                class="size-9 rounded-full object-cover"
              />
              <img
                v-else
                :src="defaultProfileIcon"
                alt="預設會員頭像"
                class="size-6"
              />
            </button>

            <div
              v-if="isMemberMenuOpen"
              class="absolute right-0 top-full z-50 mt-3 w-[255px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_14px_35px_rgba(31,41,55,0.16)]"
            >
              <button
                type="button"
                class="group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[#F8FAFC]"
                aria-label="查看個人資料"
              >
                <div
                  class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[#D6DDE8] bg-white transition group-hover:border-brand-orange"
                >
                  <img
                    v-if="hasUploadedAvatar"
                    :src="memberAvatarUrl"
                    alt="會員頭像"
                    class="size-full object-cover"
                  />
                  <img
                    v-else
                    :src="defaultProfileIcon"
                    alt="預設會員頭像"
                    class="size-6"
                  />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-lg font-semibold text-brand-navy transition group-hover:text-brand-orange">
                    {{ memberDisplayName }}
                  </p>
                  <p class="truncate text-base font-medium text-brand-gray transition group-hover:text-brand-orange">
                    {{ memberDisplayEmail }}
                  </p>
                </div>
              </button>

              <button
                type="button"
                class="group flex w-full items-center gap-2 border-t border-[#EEF1F5] px-4 py-3 text-sm font-medium text-brand-gray transition hover:bg-[#F8FAFC] hover:text-brand-orange"
                @click="handleLogout"
              >
                <svg
                  class="logout-icon size-4 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                登出
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <DashboardSidebar v-if="isMemberVariant" />

  <DashboardSidebar v-else-if="shouldUseMemberSidebarOnMobile" :show-desktop="false" />

  <!-- Sidebar Overlay -->
  <div
    v-if="sidebarStore.isOpen && !isMemberVariant && !shouldUseMemberSidebarOnMobile"
    class="fixed inset-0 z-[60] bg-black/50 lg:hidden"
    @click="sidebarStore.closeSidebar()"
  />

  <!-- Sidebar -->
  <transition name="slide">
    <div
      v-if="sidebarStore.isOpen && !isMemberVariant && !shouldUseMemberSidebarOnMobile"
      class="fixed inset-y-0 right-0 z-[70] overflow-y-auto bg-white lg:hidden"
    >
      <PublicSidebar />
    </div>
  </transition>
</template>

<style scoped>
.arrow-icon {
  filter: invert(46%) sepia(8%) saturate(567%) hue-rotate(202deg) brightness(92%) contrast(88%);
}

.group:hover .arrow-icon {
  filter: invert(63%) sepia(95%) saturate(700%) hue-rotate(1deg) brightness(103%) contrast(101%);
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
</style>
