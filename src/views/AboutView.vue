<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Header from '@/components/layout/AppHeader.vue'
import Footer from '@/components/layout/AppFooter.vue'
import EyeBall from '@/components/about/EyeBall.vue'

// 自動眨眼與大圖加載連動校正
const isBlinking = ref(false)
let blinkTimer = null
let scrollTimer = null

const leftEye = ref(null)
const rightEye = ref(null)

const triggerEyesMeasure = () => {
  if (leftEye.value) leftEye.value.measure()
  if (rightEye.value) rightEye.value.measure()
}

const handleScrollThrottled = () => {
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    triggerEyesMeasure()
  }, 100)
}

const startBlinkingLoop = () => {
  blinkTimer = setInterval(() => {
    isBlinking.value = true
    setTimeout(() => {
      isBlinking.value = false
    }, 120)
  }, 6500)
}

const onCatImageLoad = () => {
  triggerEyesMeasure()
}

onMounted(() => {
  startBlinkingLoop()

  window.addEventListener('scroll', handleScrollThrottled, { passive: true })
})

onUnmounted(() => {
  if (blinkTimer) clearInterval(blinkTimer)
  if (scrollTimer) clearTimeout(scrollTimer)

  window.removeEventListener('scroll', handleScrollThrottled)
})

// 核心功能
const features = [
  {
    id: 'emergency',
    icon: 'medical_w.svg',
    en: 'Emergency Search',
    title: '即時醫療查詢',
    desc: '即時串接全台 24 小時與週末營業的寵物醫院資訊。當深夜來臨，我們一鍵為你指引最近、正在營業中的醫療庇護所。',
  },
  {
    id: 'passport',
    icon: 'healthy_w.svg',
    en: 'Health Passport',
    title: '成長健康護照',
    desc: '登入後的專屬毛孩健康護照，細心收藏每一筆醫療紀錄與成長歷程。讓日常的點滴累積，灌溉成毛孩健康的防護網。',
  },
  {
    id: 'ai',
    icon: 'ai_w.svg',
    en: 'AI Consultation',
    title: 'AI 症狀即時智慧問診',
    desc: '毛孩突發異常不適時的應急指南。透過智慧對話式問診，快速解析當前症狀並評估潛在風險，協助家長在關鍵時刻做出正確判斷，掌握最佳就醫時機。',
  },
]

// 成員
const members = [
  {
    id: 'm1',
    name: 'Kim Lu',
    bio: '後端部署與雲端資料庫串接\n會員註冊與登入功能\n動物醫院地圖與查詢功能',
    avatar: 'PawPal_mark_p.webp',
    email: 'lkimluu02@gmail.com',
    github: 'https://github.com/lKimluu',
  },
  {
    id: 'm2',
    name: 'HAO',
    bio: '前端部署與網域設\n定寵物資料與後端API\n前端功能切版',
    avatar: 'PawPal_mark_o.webp',
    email: 'yam60105@gmail.com',
    github: 'https://github.com/C-1-HAO',
  },
  {
    id: 'm3',
    name: 'Jie Lian',
    bio: '首頁 Header 切版\n儀表板 Sidebar 切版\n行事曆全端功能實作',
    avatar: 'PawPal_mark_b.webp',
    email: 'lianjie0819@gmail.com',
    github: 'https://github.com/lianjieisme',
  },
  {
    id: 'm4',
    name: 'Yu Ling',
    bio: '成長歷程全端功能\n前端功能切版',
    avatar: 'PawPal_mark_p.webp',
    email: 'zhou21935@gmail.com',
    github: 'https://github.com/zhou21935',
  },
  {
    id: 'm5',
    name: 'Wen Hsin',
    bio: '醫療紀錄全端核心功能開發\nGoogle&LINE第三方登入串接\nVI 及 UI 系統化標準設計\n前端介面與互動性開發',
    avatar: 'PawPal_mark_o.webp',
    email: 'zwhsin17@gmail.com',
    github: 'https://github.com/wenx765',
  },
]

// 3D輪播運算
const active = ref(0)
const total = members.length
const move = (dir) => (active.value = (active.value + dir + total) % total)

function cardStyle(i) {
  let offset = i - active.value
  if (offset > total / 2) offset -= total
  if (offset < -total / 2) offset += total
  const isActive = offset === 0
  const abs = Math.abs(offset)
  const x = offset * (isActive ? 0 : 120) + (isActive ? 0 : Math.sign(offset) * 20)
  const scale = isActive ? 1 : 0.7 - (abs - 1) * 0.08
  const opacity = abs > 1 ? 0.35 : isActive ? 1 : 0.7
  return {
    transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale}) rotateY(${offset * -8}deg)`,
    opacity: String(opacity),
    zIndex: String(10 - abs),
    pointerEvents: abs > 2 ? 'none' : 'auto',
    visibility: abs > 2 ? 'hidden' : 'visible',
    willChange: 'transform, opacity',
  }
}
const isActive = (i) => i === active.value

// 手勢左右滑動
const touchStartX = ref(0)
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
}
const handleTouchEnd = (e) => {
  const swipeDistance = e.changedTouches[0].clientX - touchStartX.value
  if (swipeDistance > 50) move(-1)
  else if (swipeDistance < -50) move(1)
}

const getImageUrl = (name) => new URL(`../assets/images/${name}`, import.meta.url).href
const getIconUrl = (name) => new URL(`../assets/icons/${name}`, import.meta.url).href
</script>

<template>
  <Header variant="public" />

  <main class="bg-white min-h-screen flex flex-col items-center pt-18 md:pt-24 overflow-x-hidden">
    <section class="w-full flex flex-col items-center">
      <div class="text-center md:-mb-10 px-4">
        <p class="text-xs text-brand-blue font-medium uppercase">PET INSTANT CARE PLATFORM</p>
        <h1 class="text-4xl md:text-5xl font-black text-brand-navy my-2">PawPal</h1>
        <p class="text-xs md:text-sm text-brand-gray font-light">寵物即時照護平台</p>
      </div>
      <div class="relative w-full aspect-[1000/311] overflow-hidden">
        <EyeBall
          ref="leftEye"
          :centerXPct="37"
          :centerYPct="58"
          :widthPct="11.5"
          :heightPct="7.5"
          :blinking="isBlinking"
          :rotate="20"
        />
        <EyeBall
          ref="rightEye"
          :centerXPct="63"
          :centerYPct="58"
          :widthPct="11.5"
          :heightPct="7.2"
          :blinking="isBlinking"
          :rotate="-5"
        />
        <img
          :src="getImageUrl('aboutus_cat.webp')"
          alt="Cat"
          class="absolute top-0 left-0 w-full h-full object-cover pointer-events-none z-10"
          fetchpriority="high"
          @load="onCatImageLoad"
        />
      </div>
    </section>

    <section class="max-w-5xl w-full mx-auto py-20 md:py-40 px-6">
      <div class="w-full text-center">
        <h2 class="text-brand-blue font-black text-xl md:text-3xl lg:text-[2.5rem] leading-[1.4]">
          「深夜不慌張，<br class="md:hidden" />PawPal 給毛孩一個溫柔的擁抱。」
        </h2>
        <div
          class="text-sm md:text-base mt-15 space-y-6 text-center text-brand-gray leading-loose max-w-3xl mx-auto"
        >
          <p>
            每個養寵物的家庭,或許都曾經經歷過這樣的時刻:在寧靜的深夜或是放假的週末,毛孩突然有些不對勁。看著牠們充滿信任卻又無助的眼神,我們的心跳總是漏了一拍,慌亂地在上網搜尋「現在還有開的獸醫院嗎?」
          </p>
          <p>
            <span class="text-brand-orange font-semibold">PawPal 的誕生</span
            >,正是源自於這份對毛孩的愛與牽掛。
          </p>
          <p>
            我們是一群正在前端路上努力、同時深愛著動物的學員。深知在那些焦慮的瞬間,家長們最需要的是「確定感」與「陪伴」。因此我們打造了
            PawPal
            寵物即時照護平台。我們希望在慌亂的深夜裡,這份充滿愛與即時照護的網絡隨時都在身邊,讓所有家長都能守護自己的寶貝。
          </p>
        </div>
      </div>
    </section>

    <section class="w-full flex flex-col py-8 md:py-14">
      <div class="w-full py-20 px-6">
        <div class="max-w-3xl mx-auto text-center">
          <div class="inline-block pb-4 border-b border-gray-200">
            <h2
              class="text-brand-navy font-black text-2xl sm:text-3xl md:text-4xl lg:text-[2.2rem]"
            >
              關於 PawPal
            </h2>
            <p
              class="text-xs md:text-sm tracking-[0.25em] text-brand-blue font-light uppercase mt-1.5"
            >
              ABOUT PAWPAL
            </p>
          </div>

          <div
            class="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-center md:text-left"
          >
            <div
              class="flex flex-row items-center justify-center md:justify-start gap-4 flex-shrink-0 mt-4"
            >
              <img
                :src="getImageUrl('PawPal_mark_p.webp')"
                class="h-15 md:h-45 object-contain"
                alt="PawPal Mark"
              />
              <img
                :src="getImageUrl('PawPal_type_p.webp')"
                class="h-12 object-contain md:hidden"
                alt="PawPal Type"
              />
            </div>

            <p class="text-brand-gray leading-[1.9] text-sm md:text-base mt-4 md:mt-6">
              PawPal 的名字由 <span class="font-semibold text-brand-orange">Paw（毛掌）</span> 與
              <span class="font-semibold text-brand-orange">Pal（夥伴）</span>
              結合而成，象徵著我們想成為毛孩與家長最貼心的夥伴，在日常裡溫馨陪伴，在需要時挺身而出；而我們的
              Logo 設計也緊扣著這個信念，流暢的線條勾勒出一個溫柔的手臂，將毛孩緊緊包覆，象徵著
              PawPal
              平台想帶給家長的「安心感」——不論何時，我們都會與你緊緊相依，給予毛孩全方位的即時照護與深夜陪伴。
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="w-full py-8 md:py-14 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <div class="inline-block pb-4 border-b border-gray-200">
            <h2
              class="text-brand-navy font-black text-2xl sm:text-3xl md:text-4xl lg:text-[2.2rem]"
            >
              三大核心守護
            </h2>
            <p
              class="text-xs md:text-sm tracking-[0.25em] text-brand-blue font-light uppercase mt-1.5"
            >
              OUR CORE
            </p>
          </div>
          <p class="mt-5 text-brand-gray max-w-2xl mx-auto text-sm md:text-base leading-[1.8]">
            在 PawPal,我們結合便利的查詢技術與智慧科技,為你與毛孩建構全方位的照護網絡。
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="f in features"
            :key="f.id"
            class="feature-card h-full rounded-3xl bg-[#e9eefd] p-8 flex flex-col items-center text-center"
          >
            <div
              class="size-16 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-sm p-3"
            >
              <img :src="getIconUrl(f.icon)" :alt="f.title" class="w-full h-full object-contain" />
            </div>
            <h3 class="mt-5 text-brand-navy text-xl font-bold">{{ f.title }}</h3>
            <p class="mt-1 tracking-wide text-brand-orange text-[0.75rem] uppercase font-medium">
              {{ f.en }}
            </p>
            <p class="mt-4 text-brand-navy/75 text-sm leading-[1.8] text-left md:text-center">
              {{ f.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 團隊成員 -->
    <section class="w-full py-8 md:py-14 px-6 mb-20 overflow-hidden">
      <div class="max-w-5xl mx-auto text-center">
        <div class="text-center mb-16">
          <div class="inline-block pb-4 border-b border-gray-200">
            <h2
              class="text-brand-navy font-black text-2xl sm:text-3xl md:text-4xl lg:text-[2.2rem]"
            >
              團隊成員
            </h2>
            <p
              class="text-xs md:text-sm tracking-[0.25em] text-brand-blue font-light uppercase mt-1.5"
            >
              OUR TEAM
            </p>
          </div>
        </div>
        <div
          class="relative mt-14 h-[400px]"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
        >
          <div class="relative h-full [perspective:1200px]">
            <div
              v-for="(m, i) in members"
              :key="m.id"
              class="team-card absolute left-1/2 top-1/2 cursor-pointer"
              :style="cardStyle(i)"
              @click="!isActive(i) && (active = i)"
            >
              <div
                class="w-[300px] p-10 rounded-3xl bg-white shadow-xl overflow-hidden flex flex-col items-center text-center border border-gray-100 transition duration-300"
              >
                <div
                  class="size-24 rounded-full flex items-center justify-center shrink-0 border border-gray-100 bg-gray-50 overflow-hidden transition duration-300"
                >
                  <img
                    :src="getImageUrl(m.avatar)"
                    :alt="m.name"
                    class="w-full h-full object-cover"
                  />
                </div>
                <h3 class="mt-4 text-brand-navy font-bold text-2xl transition duration-300">
                  {{ m.name }}
                </h3>
                <div v-if="isActive(i)" class="w-full mt-4 flex flex-col items-center gap-3">
                  <p class="text-brand-gray text-sm leading-[1.8] whitespace-pre-line">
                    {{ m.bio }}
                  </p>
                  <p
                    class="text-xs text-brand-navy/80 break-all select-all flex items-center justify-center gap-1.5"
                  >
                    <img
                      :src="getIconUrl('email_b.svg')"
                      alt="Email"
                      class="size-3.5 object-contain"
                    />
                    {{ m.email }}
                  </p>
                  <a
                    :href="m.github"
                    target="_blank"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-medium text-brand-navy transition duration-200 mt-1"
                    @click.stop
                  >
                    <img
                      :src="getIconUrl('github.svg')"
                      alt="GitHub"
                      class="size-4 object-contain"
                    />
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div
            class="hidden md:block pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-white to-transparent z-20"
          ></div>
          <div
            class="hidden md:block pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-white to-transparent z-20"
          ></div>
          <button
            @click="move(-1)"
            aria-label="上一位"
            class="group hidden md:flex absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 size-11 rounded-full bg-white shadow-md items-center justify-center border border-gray-100 hover:bg-brand-blue transition-colors"
          >
            <img
              :src="getIconUrl('left-chevron.svg')"
              alt="上一位"
              class="size-5 object-contain transition group-hover:brightness-0 group-hover:invert"
            />
          </button>
          <button
            @click="move(1)"
            aria-label="下一位"
            class="group hidden md:flex absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 size-11 rounded-full bg-white shadow-md items-center justify-center border border-gray-100 hover:bg-brand-blue transition-colors"
          >
            <img
              :src="getIconUrl('right-chevron.svg')"
              alt="下一位"
              class="size-5 object-contain transition group-hover:brightness-0 group-hover:invert"
            />
          </button>
        </div>
        <div class="mt-8 flex justify-center gap-2">
          <button
            v-for="(m, i) in members"
            :key="m.id"
            :aria-label="`前往 ${m.name}`"
            @click="active = i"
            class="size-3 rounded-full transition duration-300"
            :class="i === active ? 'bg-brand-blue scale-125' : 'bg-brand-blue/30 scale-100'"
          ></button>
        </div>
      </div>
    </section>

    <!-- 結尾CTA -->
    <section class="relative w-full bg-brand-navy text-white pt-20 pb-0">
      <div class="relative z-10 max-w-5xl mx-auto text-center px-6">
        <img
          :src="getImageUrl('PawPal_mark_w.webp')"
          alt="PawPal Logo"
          class="size-30 mx-auto object-contain"
        />
        <h2 class="mt-6 text-2xl md:text-4xl lg:text-[2.6rem] font-bold leading-[1.4]">
          「因為理解你的焦慮,<br class="md:hidden" />所以我們想做得更多。」
        </h2>
        <div class="max-w-3xl mx-auto mt-6 space-y-5 text-white leading-[1.9]">
          <p class="text-sm md:text-base">
            雖然我們還在前往專業前端工程師的航道上,但我們用對待自己毛孩的標準,對網頁的流暢度與醫療資訊的正確性嚴格把關。
            現在,PawPal已經準備好了。不論你是需要一份深夜的安心感,還是想為毛孩留下成長的足跡,<br />都歡迎你加入我們！
          </p>
        </div>
        <div class="mt-9 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <RouterLink
            to="/hospital"
            class="cta-primary cursor-pointer group inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-8 py-4 text-white font-semibold transition hover:bg-[#e48d00]"
          >
            現在就搜尋附近營業醫院
          </RouterLink>
          <RouterLink
            to="/register"
            class="cta-secondary cursor-pointer group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-white border-2 border-white/60 bg-white/5 backdrop-blur-sm font-semibold transition hover:bg-white/20"
          >
            註冊建立毛孩健康護照
          </RouterLink>
        </div>
      </div>
      <div class="mt-10 w-full block">
        <picture class="w-full block h-auto">
          <source media="(max-width: 767px)" :srcset="getImageUrl('aboutus_mobile.webp')" />
          <img
            :src="getImageUrl('aboutus.webp')"
            alt="Footer Illustration"
            class="w-full block h-auto opacity-80"
          />
        </picture>
      </div>
    </section>
  </main>

  <Footer />
</template>

<style scoped>
.team-card {
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.45s ease;
  transform-style: preserve-3d;
}
.feature-card {
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.feature-card:hover {
  transform: translateY(-6px);
}
</style>
