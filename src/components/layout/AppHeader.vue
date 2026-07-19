<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PublicSidebar from '@/components/layout/PublicSidebar.vue'
import DashboardSidebar from '@/components/layout/DashboardSidebar.vue'
import UserProfileModal from '@/components/member/UserProfileModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useSessionStore } from '@/stores/session.js'
import { useSidebarStore } from '@/stores/sidebar'
import {
  getUserAvatarUrl,
  getUserDisplayEmail,
  getUserDisplayName,
  hasUserAvatar,
} from '@/utils/userProfile.js'
import defaultProfileIcon from '@/assets/icons/user.svg'
import aboutIcon from '@/assets/icons/about-team.svg'
import knowledgeIcon from '@/assets/icons/knowledge-lightbulb.svg'
import loginIcon from '@/assets/icons/login.svg'
import homeIcon from '@/assets/icons/home.svg'

const props = defineProps({
  variant: {
    type: String,
    default: 'public',
    validator: (value) => ['public', 'member'].includes(value),
  },
})

const sidebarStore = useSidebarStore()
const authStore = useAuthStore()
const sessionStore = useSessionStore()
const router = useRouter()
const memberMenuRef = ref(null)
const isMemberMenuOpen = ref(false)
const isUserProfileModalOpen = ref(false)

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

function handleOpenUserProfileModal() {
  isUserProfileModalOpen.value = true
  closeMemberMenu()
}

function handleDocumentClick(event) {
  if (!memberMenuRef.value?.contains(event.target)) {
    closeMemberMenu()
  }
}

function handleLogout() {
  sessionStore.logout()
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
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 bg-white shadow-sm">
    <!-- 手機版與平板版 -->
    <div class="lg:hidden">
      <div class="mx-auto flex h-[55px] items-center justify-between px-4">
        <RouterLink to="/" class="items-center">
          <img src="@/assets/images/PawPal_logo.webp" alt="logo" class="h-10 w-auto md:h-8" />
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
        <img src="@/assets/images/PawPal_logo.webp" alt="logo" class="h-12 w-auto" />
      </RouterLink>

      <div class="flex items-center gap-3">
        <nav class="mr-2 flex items-center gap-3" aria-label="快速導覽">
          <RouterLink
            to="/about"
            aria-label="關於我們"
            class="group relative grid size-11 place-items-center rounded-full bg-white shadow-[0_4px_14px_rgba(146,168,245,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-brand-orange/10 hover:shadow-[0_7px_18px_rgba(255,160,2,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
          >
            <img :src="aboutIcon" alt="" class="size-5 object-contain" />
            <span
              role="tooltip"
              class="pointer-events-none invisible absolute left-1/2 top-full z-50 mt-2.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-[0_8px_20px_rgba(53,76,130,0.22)] transition duration-150 before:absolute before:-top-1 before:left-1/2 before:size-2 before:-translate-x-1/2 before:rotate-45 before:bg-brand-navy group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:visible group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
            >
              關於我們
            </span>
          </RouterLink>

          <a
            href="/pet-trivia"
            aria-label="毛孩知識+"
            class="group relative grid size-11 place-items-center rounded-full bg-white shadow-[0_4px_14px_rgba(146,168,245,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-brand-orange/10 hover:shadow-[0_7px_18px_rgba(255,160,2,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
          >
            <img :src="knowledgeIcon" alt="" class="size-5 object-contain" />
            <span
              role="tooltip"
              class="pointer-events-none invisible absolute left-1/2 top-full z-50 mt-2.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-[0_8px_20px_rgba(53,76,130,0.22)] transition duration-150 before:absolute before:-top-1 before:left-1/2 before:size-2 before:-translate-x-1/2 before:rotate-45 before:bg-brand-navy group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:visible group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
            >
              毛孩知識+
            </span>
          </a>
        </nav>

        <RouterLink
          to="/hospital"
          class="flex items-center justify-center rounded-full bg-brand-orange px-4 py-2 text-white shadow-[0_4px_14px_rgba(255,160,2,0.2)] transition hover:-translate-y-0.5 hover:bg-[#e58f04] hover:shadow-[0_7px_18px_rgba(255,160,2,0.28)]"
        >
          <img src="@/assets/icons/location.svg" alt="" class="size-5" />
          搜尋附近醫院
        </RouterLink>

        <span class="ml-2 mr-0 h-8 w-px bg-[#D9DEE8]" aria-hidden="true" />

        <RouterLink
          v-if="!authStore.isLoggedIn"
          to="/login"
          class="group flex h-12 items-center justify-center gap-2 rounded-full py-2 pl-2 pr-3 text-base font-medium text-brand-gray transition hover:text-brand-orange"
        >
          <img :src="loginIcon" alt="" class="auth-action-icon size-6 shrink-0" />
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
              class="size-9 rounded-full object-cover object-center"
            />
            <img
              v-else
              :src="defaultProfileIcon"
              alt="預設會員頭像"
              class="size-6 text-brand-gray"
            />
          </button>

          <div
            v-if="isMemberMenuOpen"
            class="absolute right-0 top-full z-50 mt-3 w-[255px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_14px_35px_rgba(31,41,55,0.16)]"
          >
            <div class="flex w-full items-center gap-3 px-4 py-4">
              <div
                class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[#D6DDE8] bg-white"
              >
                <img
                  v-if="hasUploadedAvatar"
                  :src="memberAvatarUrl"
                  alt="會員頭像"
                  class="size-full object-cover object-center"
                />
                <img
                  v-else
                  :src="defaultProfileIcon"
                  alt="預設會員頭像"
                  class="size-6 text-brand-gray"
                />
              </div>
              <div class="min-w-0">
                <p class="truncate text-lg font-semibold text-brand-navy">
                  {{ memberDisplayName }}
                </p>
                <p class="truncate text-base font-medium text-brand-gray">
                  {{ memberDisplayEmail }}
                </p>
              </div>
            </div>

            <RouterLink
              to="/dashboard"
              class="group flex w-full items-center gap-2 border-t border-[#EEF1F5] px-4 py-3 text-sm font-medium text-brand-gray transition hover:bg-[#F8FAFC] hover:text-brand-orange"
              @click="closeMemberMenu"
            >
              <img :src="homeIcon" alt="" class="auth-action-icon size-4 shrink-0" />
              會員首頁
            </RouterLink>

            <button
              type="button"
              class="group flex w-full items-center gap-2 border-t border-[#EEF1F5] px-4 py-3 text-sm font-medium text-brand-gray transition hover:bg-[#F8FAFC] hover:text-brand-orange"
              @click="handleOpenUserProfileModal"
            >
              <img :src="defaultProfileIcon" alt="" class="auth-action-icon size-4 shrink-0" />
              個人資料
            </button>

            <button
              type="button"
              class="group flex w-full items-center gap-2 border-t border-[#EEF1F5] px-4 py-3 text-sm font-medium text-brand-gray transition hover:bg-[#F8FAFC] hover:text-brand-orange"
              @click="handleLogout"
            >
              <img :src="loginIcon" alt="" class="auth-action-icon size-4 shrink-0 -scale-x-100" />
              登出
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <DashboardSidebar v-if="isMemberVariant" @open-user-profile="handleOpenUserProfileModal" />

  <DashboardSidebar
    v-else-if="shouldUseMemberSidebarOnMobile"
    :show-desktop="false"
    @open-user-profile="handleOpenUserProfileModal"
  />

  <UserProfileModal
    v-if="authStore.isLoggedIn"
    :is-open="isUserProfileModalOpen"
    :user="authStore.user"
    @close="isUserProfileModalOpen = false"
  />

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
.group:hover .auth-action-icon {
  filter: brightness(0) saturate(100%) invert(67%) sepia(99%) saturate(1924%) hue-rotate(359deg)
    brightness(101%) contrast(104%);
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
