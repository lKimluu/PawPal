<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session.js'
import { useSidebarStore } from '@/stores/sidebar'
import home from '@/assets/icons/home.svg'
import home_o from '@/assets/icons/home_o.svg'
import location from '@/assets/icons/location_gray.svg'
import location_o from '@/assets/icons/location_o.svg'
import diagnostic from '@/assets/icons/diagnostic_gray.svg'
import diagnostic_o from '@/assets/icons/diagnostic.svg'
import growth from '@/assets/icons/pet-growth.svg'
import growth_o from '@/assets/icons/pet-growth_o.svg'
import logoutIcon from '@/assets/icons/login.svg'

const props = defineProps({
  showDesktop: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['open-user-profile'])

const sidebarStore = useSidebarStore()
const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()

function isActive(item) {
  return route.path === item.to
}

function getIcon(item) {
  return isActive(item) ? item.activeIcon : item.icon
}

function handleOpenUserProfile() {
  sidebarStore.closeSidebar()
  emit('open-user-profile')
}

function handleLogout() {
  sessionStore.logout()
  sidebarStore.closeSidebar()
  router.push('/login')
}

const navItems = [
  { key: 'home', icon: home, activeIcon: home_o, label: '首頁', to: '/dashboard' },
  { key: 'map', icon: location, activeIcon: location_o, label: '醫院地圖', to: '/hospital' },
  { key: 'records', icon: diagnostic, activeIcon: diagnostic_o, label: '醫療紀錄', to: '/medical' },
  { key: 'growth', icon: growth, activeIcon: growth_o, label: '成長歷程', to: '/growth' },
]
</script>

<template>
  <!-- 手機&平板 -->
  <div v-if="sidebarStore.isOpen" class="fixed inset-0 z-50 lg:hidden">
    <!-- 遮罩 -->
    <div class="absolute inset-0 bg-black/50" @click="sidebarStore.closeSidebar()" />
    <aside
      class="absolute right-0 top-0 flex h-full w-80 flex-col overflow-y-auto overflow-x-hidden bg-brand-white"
    >
      <div class="flex items-center justify-end px-5 pt-5">
        <button
          type="button"
          class="grid h-9 w-9 cursor-pointer place-items-center text-brand-gray hover:text-brand-orange"
          aria-label="關閉選單"
          @click="sidebarStore.closeSidebar()"
        >
          <img src="@/assets/icons/close.svg" alt="Close Icon" class="h-4 w-4" />
        </button>
      </div>

      <nav class="flex flex-col gap-5 px-8 pt-2 pb-5">
        <section>
          <ul class="flex flex-col gap-4">
            <li>
              <RouterLink
                to="/about"
                @click="sidebarStore.closeSidebar()"
                class="cursor-pointer px-3 text-sm font-medium text-brand-gray active:text-brand-orange"
              >
                關於我們
              </RouterLink>
            </li>

            <li>
              <span class="text-base font-bold tracking-wider text-brand-navy">醫療專區</span>
            </li>

            <li>
              <RouterLink
                to="/hospital"
                class="cursor-pointer px-3 text-sm font-medium text-brand-gray active:text-brand-orange"
                >搜尋醫療院所</RouterLink
              >
            </li>

            <li>
              <span class="text-base font-bold tracking-wider text-brand-navy"> 寵物知識 </span>
            </li>

            <li>
              <a
                href="/pet-trivia"
                class="cursor-pointer px-3 text-sm font-medium text-brand-gray active:text-brand-orange"
                >毛孩知識 +</a
              >
            </li>
            <li>
              <span class="text-base font-bold tracking-wider text-brand-navy">會員專區</span>
            </li>

            <li>
              <button
                type="button"
                class="cursor-pointer px-3 text-sm font-medium text-brand-gray active:text-brand-orange"
                @click="handleOpenUserProfile"
              >
                個人資料
              </button>
            </li>
          </ul>
        </section>

        <!-- Dashboard（新增） -->
        <section>
          <ul class="flex flex-col gap-4">
            <li>
              <span class="text-base font-bold tracking-wider text-brand-navy">寵物專區</span>
            </li>

            <li>
              <RouterLink
                to="/dashboard"
                @click="sidebarStore.closeSidebar()"
                class="cursor-pointer px-3 text-sm font-medium text-brand-gray active:text-brand-orange"
                >首頁</RouterLink
              >
            </li>

            <li>
              <RouterLink
                to="/hospital"
                class="cursor-pointer px-3 text-sm font-medium text-brand-gray active:text-brand-orange"
                >醫院地圖</RouterLink
              >
            </li>

            <li>
              <RouterLink
                to="/medical"
                class="px-3 text-sm font-medium text-brand-gray active:text-brand-orange"
                >醫療紀錄</RouterLink
              >
            </li>

            <li>
              <RouterLink
                to="/growth"
                class="px-3 text-sm font-medium text-brand-gray active:text-brand-orange"
                >成長歷程</RouterLink
              >
            </li>
            <li>
              <div
                class="flex items-center justify-center border-t border-brand-lightblue pt-[50px]"
              >
                <button
                  type="button"
                  @click="handleLogout"
                  class="group flex cursor-pointer items-center gap-1.5 text-base font-medium text-brand-gray transition hover:text-brand-orange active:text-brand-orange"
                >
                  <img
                    :src="logoutIcon"
                    alt="Logout Icon"
                    class="h-4 w-4 -scale-x-100 transition group-hover:[filter:brightness(0)_saturate(100%)_invert(67%)_sepia(99%)_saturate(1924%)_hue-rotate(359deg)_brightness(101%)_contrast(104%)]"
                  />
                  登出
                </button>
              </div>
            </li>
          </ul>
        </section>
      </nav>

      <div class="px-6 pb-8">
        <RouterLink
          to="/hospital"
          @click="sidebarStore.closeSidebar()"
          class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-orange py-4 text-base font-medium text-brand-white shadow-md transition active:bg-[#E08F00]"
        >
          <img src="@/assets/icons/search-hospital.svg" alt="Hospital Icon" class="h-5 w-5" />
          搜尋附近醫院
        </RouterLink>
      </div>
    </aside>
  </div>

  <!-- 電腦 -->
  <aside
    v-if="props.showDesktop"
    class="hidden lg:flex fixed left-0 top-[68px] h-[calc(100vh-68px)] w-52 flex-col bg-[#ECF1FD] z-40"
  >
    <nav class="flex flex-1 flex-col py-6">
      <ul class="flex flex-col">
        <li v-for="item in navItems" :key="item.key">
          <RouterLink
            v-if="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-5 py-3 text-base font-medium hover:bg-[#e6eaf4]"
            :class="
              isActive(item)
                ? 'text-brand-orange border-l-4 border-brand-orange bg-[#e6eaf4]'
                : 'text-brand-gray'
            "
          >
            <img :src="getIcon(item)" :alt="item.label + ' icon'" class="h-5 w-5 shrink-0" />
            {{ item.label }}
          </RouterLink>
          <div
            v-else
            class="flex items-center gap-3 px-5 py-3 text-base font-medium text-brand-gray"
          >
            <img :src="item.icon" :alt="item.label + ' icon'" class="h-5 w-5 shrink-0" />
            {{ item.label }}
          </div>
        </li>
      </ul>
    </nav>
  </aside>
</template>
