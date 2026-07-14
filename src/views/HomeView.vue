<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import bgImage from '@/assets/images/home-bg.png'
import visualImage from '@/assets/images/home-visual.png'
import aboutImage from '@/assets/images/home-about.png'
import IconLocation from '@/assets/icons/location_o.svg'
import Header from '@/components/layout/AppHeader.vue'
import Footer from '@/components/layout/AppFooter.vue'
import { useLocationStore } from '@/stores/location.js'

const locationStore = useLocationStore()
const { userLocation, isLocating, locationError, hasRequestedLocation } = storeToRefs(locationStore)

const services = [
  {
    icon: 'diagnostic.svg',
    title: 'AI 即時診斷',
    desc: '描述症狀、上傳照片，立刻取得初步建議',
    path: '/#',
  },
  {
    icon: 'aid.svg',
    title: '緊急處置教學',
    desc: '視覺化步驟教學，緊急時刻不再手忙腳亂',
    path: '/#',
  },
  {
    icon: 'book.svg',
    title: '衛教文章',
    desc: '獸醫師審定，科學養寵不再憑直覺',
    path: '/#',
  },
  {
    icon: 'chat.svg',
    title: '經驗分享討論區',
    desc: '與千千萬萬個飼主交流真實看診經驗',
    path: '/#',
  },
  {
    icon: 'paw-orange.svg',
    title: '寵物健康護照',
    desc: '紀錄基本資料、病歷與成長歷程',
    path: '/#',
  },
  {
    icon: 'hospital.svg',
    title: '搜尋醫療院所',
    desc: '即時顯示營業中、可看診、地圖導航與評論',
    path: '/#',
  },
]

const getIconUrl = (name) => {
  return new URL(`../assets/icons/${name}`, import.meta.url).href
}

onMounted(() => {
  locationStore.requestCurrentLocation()
})
</script>

<template>
  <Header variant="public" />
  <main
    class="w-full min-h-screen select-none overflow-x-hidden pt-[87px] pb-56 text-brand-gray lg:pt-[100px] pawpal-container"
  >
    <section class="hero-section text-center w-full">
      <span
        class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-full bg-brand-lightblue text-brand-blue"
      >
        24 小時陪伴每一個緊急時刻
      </span>
      <div class="w-full max-w-3xl mx-auto mt-7 px-4 text-center">
        <h1
          class="text-2xl md:text-4xl lg:text-5xl font-black tracking-wide leading-snug text-brand-navy"
        >
          深夜也
          <span class="text-brand-orange">不慌</span>
          ，
          <br />
          毛孩的
          <span
            class="text-white px-2 py-0.5 rounded-xl inline-block mr-2 mt-1 md:mt-0 bg-brand-blue whitespace-nowrap"
          >
            即時照護
          </span>
          <span class="inline-block whitespace-nowrap">就在身邊</span>
        </h1>
        <p class="text-xs mt-4 leading-relaxed max-w-xl mx-auto px-2 text-brand-gray">
          PawPal 幫你立刻找到附近
          <span class="text-brand-orange font-bold">正在營業中</span>
          的動物醫院，
          <br class="md:hidden" />
          還有 AI 診斷、急救教學與寵物健康護照
        </p>
      </div>
      <div class="w-full relative mt-8 pt-6 pb-20 md:pb-32">
        <div
          class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] md:w-full h-[90%] md:h-[70%] bg-[length:100%_100%] bg-no-repeat bg-bottom z-0"
          :style="{ backgroundImage: `url(${bgImage})` }"
        ></div>
        <div class="w-full max-w-5xl mx-auto px-4 relative z-1">
          <!-- 電腦版附近醫院卡片列表 -->
          <div class="hidden md:grid grid-cols-3 gap-4 w-full relative z-2">
            <RouterLink
              v-for="i in 3"
              :key="i"
              to="/#"
              class="bg-white/30 backdrop-blur-md p-5 rounded-2xl border border-[#E2E8F0] text-left transition-all duration-300 shadow-[0_2px_10px_rgba(255,160,2,0.2)] lg:hover:-translate-y-1 lg:hover:shadow-[0_10px_30px_rgba(255,160,2,0.4)] cursor-pointer active:scale-[0.99]"
            >
              <p class="text-[10px] font-medium tracking-wide text-brand-gray">最近醫院</p>
              <p class="text-base font-bold mt-0.5 text-brand-navy">嗨嗨動物醫院</p>
              <div class="flex justify-between items-center mt-4">
                <span class="text-sm font-black text-brand-navy">0.4 km</span>
                <span class="text-xs font-black text-brand-orange flex items-center gap-1">
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-brand-orange inline-block animate-pulse"
                  ></span>
                  營業中
                </span>
              </div>
            </RouterLink>
          </div>
          <div
            v-if="hasRequestedLocation || isLocating || locationError || userLocation"
            class="relative z-2 mx-auto mt-4 inline-flex max-w-full items-center justify-center rounded-full bg-white/75 px-4 py-2 text-xs font-bold shadow-[0_6px_18px_rgba(61,74,122,0.12)] backdrop-blur text-brand-navy"
            aria-live="polite"
          >
            <span v-if="isLocating">正在取得目前位置</span>
            <span v-else-if="locationError" class="text-brand-orange">{{ locationError }}</span>
            <span v-else-if="userLocation">已取得目前位置</span>
          </div>
          <div
            class="-mx-4 md:mx-auto w-[calc(100%+2rem)] md:max-w-[600px] lg:max-w-none lg:w-full relative z-1 -mt-6 md:-mt-12"
          >
            <img
              :src="visualImage"
              alt="PawPal 首頁視覺插畫圖"
              class="w-full h-auto object-contain block mx-auto"
            />
          </div>

          <div
            class="flex flex-wrap justify-center items-center gap-4 md:gap-8 mt-6 mb-8 relative z-2 text-xs md:text-sm font-medium text-brand-gray"
          >
            <span class="flex items-center gap-1.5">即時營業狀態</span>
            <span class="flex items-center gap-1.5">真實飼主評論</span>
            <span class="flex items-center gap-1.5">專業急救指南</span>
          </div>
          <!-- 手機版附近醫院卡片列表 -->
          <div class="md:hidden flex flex-col gap-3 mt-4 mb-8 relative z-2 w-full">
            <RouterLink
              v-for="i in 3"
              :key="i"
              to="/#"
              class="bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between text-left transition-all duration-150 active:scale-[0.99] active:bg-[#f8fafc] active:shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center">
                  <img :src="IconLocation" alt="Location" class="w-9 h-9 object-contain" />
                </div>
                <div>
                  <p class="text-[10px] font-medium tracking-wide text-brand-gray">最近醫院</p>
                  <p class="text-sm font-bold mt-0.5 text-brand-navy">勝勝動物醫院</p>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xs font-black text-brand-navy">0.4 km</p>
                <p
                  class="text-[11px] font-bold text-brand-orange mt-1 flex items-center gap-1 justify-end"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-brand-orange inline-block animate-pulse"
                  ></span>
                  營業中
                </p>
              </div>
            </RouterLink>
          </div>
          <div
            class="w-full relative z-2 mt-4 md:mt-8 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-[0_12px_40px_rgba(235,140,0,0.25)] text-white gap-6 bg-gradient-to-r from-[#ffa002] to-[#ffb357]"
          >
            <div class="flex items-center gap-4 text-left w-full md:w-auto">
              <div
                class="w-12 h-12 rounded-full bg-white/20 items-center justify-center text-2xl shrink-0 hidden md:flex"
              >
                ❤
              </div>
              <div>
                <h3 class="text-lg md:text-xl font-bold text-white leading-snug">
                  毛孩突發狀況？別慌，PawPal 在這裡
                </h3>
                <p class="text-xs opacity-90 mt-1">
                  一鍵搜尋附近 24 小時急診醫院，或先看視覺化急救教學爭取黃金時間
                </p>
              </div>
            </div>
            <div class="w-full md:w-auto flex flex-col md:flex-row items-center gap-3 shrink-0">
              <RouterLink
                to="/#"
                class="w-full tracking-wider md:w-auto bg-white font-bold py-3 px-8 rounded-full shadow-md text-sm transition-all lg:hover:scale-105 active:scale-[0.99] block text-center text-brand-orange"
              >
                立即搜尋醫院
              </RouterLink>

              <RouterLink
                to="/#"
                class="w-full tracking-wider md:w-auto bg-transparent text-white font-bold py-3 px-8 rounded-full border-2 border-white/80 text-sm backdrop-blur-[2px] transition-all lg:hover:bg-white/10 lg:hover:scale-105 active:scale-[0.99] block text-center"
              >
                查詢急救教學
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="services-section mt-32 text-center px-4 w-full max-w-5xl mx-auto">
      <h2 class="services-title text-2xl md:text-4xl font-extrabold text-brand-navy">
        一站式毛孩照護
      </h2>
      <p class="text-xs md:text-sm mt-2 font-sm text-brand-gray">
        從緊急救助到日常陪伴，PawPal都在
      </p>
      <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <RouterLink
          v-for="(card, index) in services"
          :key="index"
          :to="card.path"
          class="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex items-start gap-4 text-left cursor-pointer transition-all duration-200 lg:hover:scale-[1.012] lg:hover:shadow-[0_10px_30px_rgba(146,168,245,0.12)] lg:hover:border-brand-blue/30 active:bg-[#F8FAFC] active:scale-[0.99]"
        >
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-brand-lightblue"
          >
            <img :src="getIconUrl(card.icon)" :alt="card.title" class="w-6 h-6 object-contain" />
          </div>
          <div class="services-content">
            <h3 class="text-base md:text-lg font-bold text-brand-navy">
              {{ card.title }}
            </h3>
            <p class="text-xs md:text-sm mt-1 leading-relaxed text-brand-gray">
              {{ card.desc }}
            </p>
          </div>
        </RouterLink>
      </div>
    </section>
    <section
      class="about-me-section mt-32 text-center px-4 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 md:text-left"
    >
      <div class="w-full md:w-1/2 flex justify-center">
        <img
          :src="aboutImage"
          alt="關於PawPal"
          class="w-full h-auto max-h-[400px] rounded-3xl object-cover shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
          loading="lazy"
        />
      </div>
      <div class="w-full md:w-1/2 px-2">
        <p class="text-xs font-bold tracking-widest uppercase text-brand-orange">ABOUT PAWPAL</p>
        <h2 class="text-2xl md:text-3xl font-black mt-3 text-[#3d4a7a]">
          為毛孩家庭設計的溫慢科技
        </h2>
        <p class="text-xs md:text-sm md:my-4 mt-4 leading-relaxed text-brand-gray">
          我們深知每一個毛孩家庭都希望給寶貝最好的照護。
          <br class="md:hidden" />
          PawPal將即時資訊、專業知識與溫慢陪伴整合在一起，讓你不論身處何地、何時，都能安心。
        </p>
        <RouterLink
          to="/about"
          class="tracking-wider mt-6 inline-flex items-center justify-center gap-2 text-sm font-bold border-2 px-6 py-2.5 rounded-full transition-all duration-200 lg:hover:scale-[1.02] active:bg-brand-blue active:text-brand-white active:scale-[0.99] border-brand-blue text-brand-blue lg:hover:bg-brand-blue lg:hover:text-white"
        >
          了解更多 ➔
        </RouterLink>
      </div>
    </section>
  </main>
  <Footer />
</template>
