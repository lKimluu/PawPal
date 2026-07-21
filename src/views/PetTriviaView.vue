<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'
import Header from '@/components/layout/AppHeader.vue'
import Footer from '@/components/layout/AppFooter.vue'
import TriviaCardStack from '@/components/trivia/TriviaCardStack.vue'

const cardStackRef = ref(null)
const isFlippedState = ref(false)
const currentHoverSide = ref(null)
const currentTopIndex = ref(0)
const isTransitioning = ref(false)
const activeNextColor = ref('')
const isDesktop = ref(false)
const leftCircleRef = ref(null)
const rightCircleRef = ref(null)
const nextTextRef = ref(null)
const answerTextRef = ref(null)
const touchStartX = ref(0)
const touchStartY = ref(0)

let mediaQuery = null
const handleMediaChange = (e) => {
  isDesktop.value = e.matches
}

const handleTouchStart = (e) => {
  const touch = e.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
}

const handleTouchEnd = (e) => {
  if (isDesktop.value || isTransitioning.value) return

  const touch = e.changedTouches[0]

  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value

  if (Math.abs(deltaY) > Math.abs(deltaX)) return
  if (Math.abs(deltaX) < 50) return
  if (Math.abs(deltaY) > 40) return
  if (deltaX < 0) {
    handleLeftClick()
  } else {
    handleRightClick()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(min-width: 1024px)')
    isDesktop.value = mediaQuery.matches
    mediaQuery.addEventListener('change', handleMediaChange)
  }
})

onUnmounted(() => {
  if (mediaQuery) mediaQuery.removeEventListener('change', handleMediaChange)
})

const petTriviaList = [
  {
    id: 1,
    category: 'canine',
    themeBg: '#92a8f5',
    title: '為什麼狗狗睡覺時會踢腳？',
    content:
      '因為牠們正在夢裡奔跑！狗狗與人類一樣會經歷「快速動眼期（REM）」，這時大腦非常活躍。當牠們在夢中追逐球球或跑步時，大腦發出的運動訊號有時會穿透肌肉阻斷機制，讓牠們的腳爪、嘴巴甚至尾巴跟著微微抽動，超級可愛！',
    image: 'dog.webp',
  },
  {
    id: 2,
    category: 'feline',
    themeBg: '#f098c5',
    title: '貓咪的呼嚕聲其實不只代表開心？',
    content:
      '沒錯！雖然貓咪在放鬆、撒嬌時會發出呼嚕聲，但當牠們感到緊張、恐懼、疼痛，甚至是在生產或生病時，也會藉由呼嚕聲的低頻振動來安撫自己、減緩痛覺並促進骨骼與組織修復。這就像是牠們隨身攜帶的「自我療癒系統」喔！',
    image: 'cat.webp',
  },
  {
    id: 3,
    category: 'lagomorph',
    themeBg: '#f8d64d',
    title: '兔子開心時會做出什麼驚人舉動？',
    content:
      '牠們會展現神奇的「快樂彈跳（Binky）」！當兔子極度興奮與安心時，會突然原地垂直躍起，並在半空中做出扭動身體、甩頭或踢後腳的高難度動作。這代表牠們現在心情超級好，也是飼主們最想捕捉到的可愛瞬間！',
    image: 'rabbit.webp',
  },
  {
    id: 4,
    category: 'rodent',
    themeBg: '#a68ae7',
    title: '倉鼠跑滾輪，一天到底能跑多遠？',
    content:
      '牠們是超級馬拉松選手！雖然倉鼠體型嬌小，但因為在野外需要長途跋涉尋找食物，一隻健康的倉鼠在精力旺盛的夜晚，一天可以利用滾輪跑上 5 到 8 公里，這相當於人類每天跑一場半程馬拉松呢！',
    image: 'hamster.webp',
  },
  {
    id: 5,
    category: 'reptile',
    themeBg: '#579066',
    title: '烏龜的殼是牠們穿的衣服嗎？',
    content:
      '絕對不是！卡通裡烏龜可以「脫殼」的畫面是騙人的。龜殼其實是烏龜肋骨和脊椎骨向外特化並融合而成的骨骼系統，裡面佈滿了神經與血管。因此，烏龜是絕對無法和殼分離的，如果龜殼受傷，牠們也會感到非常疼痛喔！',
    image: 'turtle.webp',
  },
  {
    id: 6,
    category: 'erinaceid',
    themeBg: '#92959a',
    title: '刺蝟身上的刺，一輩子都不會換嗎？',
    content:
      '其實牠們也會經歷「換毛期」喔！刺蝟在成長過程中會經歷幾次「換刺（Quilling）」，就像人類換牙或寵物換毛一樣，舊的刺會自然脫落，並由皮膚下長出更硬、更粗的新刺。這段期間因為皮膚容易敏感緊繃，小刺蝟的心情通常會比較暴躁。',
    image: 'hedgehog.webp',
  },
  {
    id: 7,
    category: 'aquatic',
    themeBg: '#ffa002',
    title: '金魚的記憶力真的只有三秒嗎？',
    content:
      '金魚被冤枉很久了！科學家研究證實，金魚的記憶力其實長達幾個月，甚至能記住聲音與顏色。牠們甚至能透過制約訓練，學會「在特定時間游到水面等吃飯」，或是記住主人的長相，記憶力比我們想像的還好！',
    image: 'goldfish.webp',
  },
]

const currentBgColor = computed(() => petTriviaList[currentTopIndex.value].themeBg)

const handleLeftEnter = () => {
  if (isFlippedState.value || isTransitioning.value || !isDesktop.value) return
  currentHoverSide.value = 'left'
  cardStackRef.value?.hoverLeftEnter()

  if (nextTextRef.value) {
    gsap.to(nextTextRef.value, {
      x: -25,
      opacity: 1,
      duration: 0.85,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  if (leftCircleRef.value) {
    const nextIndex = (currentTopIndex.value + 1) % petTriviaList.length
    gsap.to(leftCircleRef.value, {
      clipPath: 'ellipse(35% 120% at 100% 50%)',
      backgroundColor: petTriviaList[nextIndex].themeBg,
      duration: 0.85,
      ease: 'power2.out',
    })
  }
}

const handleLeftClick = () => {
  if (isTransitioning.value) return
  isTransitioning.value = true

  const nextIndex = (currentTopIndex.value + 1) % petTriviaList.length
  activeNextColor.value = petTriviaList[nextIndex].themeBg

  cardStackRef.value?.swipeLeft()
  isFlippedState.value = false

  if (nextTextRef.value) {
    gsap.to(nextTextRef.value, {
      opacity: 0.6,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }
  if (!leftCircleRef.value || !rightCircleRef.value) {
    isTransitioning.value = false
    return
  }

  gsap.set(leftCircleRef.value, { backgroundColor: activeNextColor.value })
  gsap.set(rightCircleRef.value, { backgroundColor: activeNextColor.value })

  const animDuration = 0.85

  gsap.to(leftCircleRef.value, {
    clipPath: 'ellipse(300% 300% at 100% 50%)',
    duration: animDuration,
    ease: 'power3.inOut',
  })
  gsap.to(rightCircleRef.value, {
    clipPath: 'ellipse(300% 300% at 0% 50%)',
    duration: animDuration,
    ease: 'power3.inOut',
    onComplete: async () => {
      currentTopIndex.value = nextIndex
      await nextTick()

      gsap.set(leftCircleRef.value, { clipPath: 'ellipse(0% 120% at 100% 50%)' })
      gsap.set(rightCircleRef.value, {
        clipPath: 'ellipse(0% 120% at 0% 50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
      })
      if (nextTextRef.value) {
        gsap.to(nextTextRef.value, {
          opacity: 0.6,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }

      setTimeout(() => {
        isTransitioning.value = false
      }, 100)
    },
  })
}

const handleRightEnter = () => {
  if (isFlippedState.value || isTransitioning.value || !isDesktop.value) return
  currentHoverSide.value = 'right'
  cardStackRef.value?.hoverRightEnter()

  if (answerTextRef.value) {
    gsap.to(answerTextRef.value, {
      x: 25,
      opacity: 1,
      duration: 0.85,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  if (rightCircleRef.value) {
    gsap.to(rightCircleRef.value, {
      clipPath: 'ellipse(35% 120% at 0% 50%)',
      duration: 0.85,
      ease: 'power2.out',
    })
  }
}

const handleRightClick = () => {
  if (isFlippedState.value || isTransitioning.value) return
  cardStackRef.value?.swipeRight()
  isFlippedState.value = true
}

const handleLeaveReset = () => {
  if (isFlippedState.value || isTransitioning.value || !isDesktop.value) return
  currentHoverSide.value = null
  cardStackRef.value?.hoverLeaveReset()

  if (nextTextRef.value)
    gsap.to(nextTextRef.value, {
      x: 0,
      opacity: 0.6,
      duration: 0.7,
      ease: 'power2.out',
      overwrite: 'auto',
    })

  if (answerTextRef.value)
    gsap.to(answerTextRef.value, {
      x: 0,
      opacity: 0.6,
      duration: 0.7,
      ease: 'power2.out',
      overwrite: 'auto',
    })

  if (leftCircleRef.value) {
    gsap.to(leftCircleRef.value, {
      clipPath: 'ellipse(0% 120% at 100% 50%)',
      duration: 0.7,
      ease: 'power2.out',
    })
  }

  if (rightCircleRef.value) {
    gsap.to(rightCircleRef.value, {
      clipPath: 'ellipse(0% 120% at 0% 50%)',
      duration: 0.7,
      ease: 'power2.out',
    })
  }
}

const handleCardFlipBack = () => {
  isFlippedState.value = false
  if (rightCircleRef.value) {
    gsap.to(rightCircleRef.value, {
      clipPath: 'ellipse(0% 120% at 0% 50%)',
      duration: 0.7,
      ease: 'power2.out',
    })
  }
}
</script>

<template>
  <Header variant="public" />
  <div
    class="relative min-h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center overflow-hidden select-none pt-18 pb-18 lg:pt-25 lg:pb-25"
    :class="{ 'pointer-events-none': isTransitioning }"
    :style="{ backgroundColor: currentBgColor }"
  >
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div class="absolute left-0 top-0 bottom-0 w-1/2 bg-mask-left-box">
        <div ref="leftCircleRef" class="w-full h-full left-circle-shape"></div>
      </div>
      <div class="absolute right-0 top-0 bottom-0 w-1/2">
        <div ref="rightCircleRef" class="w-full h-full right-circle-shape bg-black/15"></div>
      </div>
    </div>
    <div class="text-center mb-6 z-30 text-white drop-shadow-md">
      <h1
        class="text-3xl md:text-4xl font-bold flex items-center justify-center gap-2 mb-3 pointer-events-none tracking-wide"
      >
        毛孩知識 +
      </h1>
      <div
        class="md:hidden flex items-center justify-center gap-20 text-lg font-semibold text-white/70 mt-1"
      >
        <button
          @click="handleLeftClick"
          class="transition-all duration-150 active:scale-95 active:text-white outline-none"
        >
          ↼ 下一張
        </button>
        <button
          @click="handleRightClick"
          :class="[
            'transition-all duration-150 active:scale-95 active:text-white outline-none',
            isFlippedState ? 'opacity-30 pointer-events-none' : '',
          ]"
        >
          看解答 ⇀
        </button>
      </div>
    </div>
    <div
      class="z-30 relative w-full max-w-[350px] flex justify-center"
      @mouseenter.stop="handleLeaveReset"
      @touchstart.passive="handleTouchStart"
      @touchend.passive="handleTouchEnd"
    >
      <div
        ref="nextTextRef"
        class="desktop-next-text hidden md:block absolute -left-40 lg:-left-70 top-1/2 -translate-y-1/2 pointer-events-none text-white/60 font-semibold text-4xl tracking-wider drop-shadow-md will-change-transform"
      >
        <span>↼ 下一張</span>
      </div>

      <div
        ref="answerTextRef"
        class="desktop-answer-text hidden md:block absolute -right-40 lg:-right-70 top-1/2 -translate-y-1/2 pointer-events-none text-white/60 font-semibold text-4xl tracking-wider drop-shadow-md will-change-transform"
      >
        <span>看解答 ⇀</span>
      </div>
      <TriviaCardStack
        ref="cardStackRef"
        :list="petTriviaList"
        @on-flip-back="handleCardFlipBack"
        @on-swiped="
          (nextCardData) => {
            const foundIndex = petTriviaList.findIndex((c) => c.id === nextCardData.id)
            if (foundIndex !== -1) currentTopIndex = foundIndex
          }
        "
      />
    </div>

    <div class="absolute inset-0 flex z-20 pointer-events-none">
      <div
        @mouseenter="handleLeftEnter"
        @mouseleave="handleLeaveReset"
        @click="handleLeftClick"
        class="w-1/2 h-full cursor-pointer bg-transparent pointer-events-auto"
      ></div>
      <div
        @click="handleRightClick"
        @mouseenter="handleRightEnter"
        @mouseleave="handleLeaveReset"
        :class="[
          'w-1/2 h-full bg-transparent pointer-events-auto',
          isFlippedState ? 'pointer-events-none' : 'cursor-pointer',
        ]"
      ></div>
    </div>
  </div>

  <Footer />
</template>

<style scoped>
.left-circle-shape {
  clip-path: ellipse(0% 120% at 100% 50%);
}
.right-circle-shape {
  clip-path: ellipse(0% 120% at 0% 50%);
}
</style>
