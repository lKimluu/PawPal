<script setup>
import { useSidebarStore } from '@/stores/sidebar'
import loginIcon from '@/assets/icons/login.svg'

const sidebarStore = useSidebarStore()
</script>

<template>
  <div class="fixed inset-0 z-50">
    <!-- 遮罩 -->
    <div
      class="absolute inset-0 bg-white/10 backdrop-opacity-60"
      @click="sidebarStore.closeSidebar()"
    />

    <!-- 選單本體 -->

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
                @click="sidebarStore.closeSidebar()"
                class="cursor-pointer px-3 text-sm font-medium text-brand-gray active:text-brand-orange"
                >搜尋醫療院所</RouterLink
              >
            </li>
          </ul>
        </section>

        <section>
          <ul class="flex flex-col gap-4">
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
          </ul>
        </section>

        <section>
          <ul class="flex flex-col gap-4">
            <li>
              <div
                class="flex items-center justify-center gap-20 border-t border-brand-lightblue pt-[50px]"
              >
                <router-link
                  to="/register"
                  @click="sidebarStore.closeSidebar()"
                  class="cursor-pointer flex items-center gap-1.5 text-base font-medium text-brand-gray active:text-brand-orange"
                >
                  <img src="@/assets/icons/register.svg" alt="Register Icon" class="h-4 w-4" />

                  註冊
                </router-link>

                <router-link
                  to="/login"
                  @click="sidebarStore.closeSidebar()"
                  class="group cursor-pointer flex items-center gap-1.5 text-base font-medium text-brand-gray active:text-brand-orange"
                >
                  <img
                    :src="loginIcon"
                    alt="Login Icon"
                    class="h-4 w-4 transition group-hover:[filter:brightness(0)_saturate(100%)_invert(67%)_sepia(99%)_saturate(1924%)_hue-rotate(359deg)_brightness(101%)_contrast(104%)]"
                  />

                  登入
                </router-link>
              </div>
            </li>
          </ul>
        </section>
      </nav>

      <div class="px-6 pb-8">
        <RouterLink
          to="/hospital"
          @click="sidebarStore.closeSidebar()"
          class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-orange py-4 text-base font-medium text-brand-white shadow-md transition hover:bg-[#e58f00] active:bg-[#E08F00]"
        >
          <img src="@/assets/icons/search-hospital.svg" alt="Hospital Icon" class="h-5 w-5" />
          搜尋附近醫院
        </RouterLink>
      </div>
    </aside>
  </div>
</template>
