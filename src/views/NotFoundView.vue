<script setup>
import Header from '@/components/layout/AppHeader.vue'
import Footer from '@/components/layout/AppFooter.vue'
</script>
<template>
  <div class="min-h-screen flex flex-col bg-brand-orange">
    <Header variant="public" />
    <main class="flex-grow flex flex-col items-center justify-center">
      <div class="w-full">
        <img
          src="@/assets/images/404_mobile.png"
          class="block md:hidden w-full h-auto object-cover mt-3"
          alt="Page Not Found - Mobile"
        />
        <img
          src="@/assets/images/404_tablet.png"
          class="hidden md:block lg:hidden w-full h-auto object-cover mt-28"
          alt="Page Not Found - Tablet"
        />
        <img
          src="@/assets/images/404_desktop.png"
          class="hidden lg:block w-full h-auto object-cover mt-16"
          alt="Page Not Found - Desktop"
        />
      </div>
      <div
        class="absolute top-[10%] right-[5%] text-right text-brand-white md:top-[7%] lg:top-[14%] lg:right-[7%]"
      >
        <p class="text-xs font-light opacity-80 mb-3 mr-1">404 NOT FOUND</p>
        <h1 class="text-4xl font-black tracking-wide">
          噢不 !
          <br class="md:hidden" />
          <span class="text-2xl md:text-4xl">您要找的網頁被拍寶偷走了</span>
        </h1>
        <p class="text-sm md:text-2xl lg:text-2xl mt-2 mb-6 lg:mt-6 tracking-wide leading-normal">
          在我們找回它之前，
          <br class="lg:hidden" />
          不如先回首頁看看吧！
        </p>
        <router-link
          to="/"
          class="text-sm md:text-2xl inline-block px-6 py-2 font-bold bg-brand-white text-brand-orange rounded-full hover:bg-brand-white/90 active:scale-95 transition"
        >
          帶我回首頁
        </router-link>
      </div>
    </main>
    <Footer />
  </div>
</template>
