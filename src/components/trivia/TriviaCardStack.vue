<script setup>
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  list: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['on-flip-back', 'on-swiped'])

const localList = ref([...props.list])
const isFlipped = ref(false)
const isDesktop = ref(false)

const containerRef = ref(null)

let mediaQuery = null
const handleMediaChange = (e) => {
  isDesktop.value = e.matches
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
  if (containerRef.value) {
    const cards = containerRef.value.querySelectorAll('.card-item')
    cards.forEach((card) => gsap.killTweensOf(card))
  }
})

const visibleCards = computed(() => {
  return localList.value.slice(0, 3)
})

const getCards = () => {
  if (!containerRef.value) return []
  return containerRef.value.querySelectorAll('.card-item')
}

const getCardStyle = (index) => {
  if (index === 0) {
    return {
      zIndex: 30,
      transform: 'translateY(0px) scale(1) rotate(0deg)',
      opacity: 1,
      boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.2)',
    }
  }
  if (index === 1) {
    return {
      zIndex: 20,
      transform: 'translateY(8px) scale(0.96) rotate(6.5deg)',
      opacity: 0.95,
      boxShadow: '0 15px 30px -10px rgba(0, 0, 0, 0.15)',
    }
  }
  return {
    zIndex: 10,
    transform: 'translateY(16px) scale(0.92) rotate(-7deg)',
    opacity: 0.75,
    boxShadow: '0 10px 20px -8px rgba(0, 0, 0, 0.1)',
  }
}

const hoverLeftEnter = () => {
  if (isFlipped.value || !isDesktop.value) return
  const cards = getCards()
  if (cards.length === 0) return

  gsap.to(cards[0], {
    x: -140,
    y: 25,
    rotateX: 15,
    rotateY: 0,
    rotate: -15,
    scale: 0.98,
    duration: 0.85,
    ease: 'power2.out',
    overwrite: 'auto',
  })
  if (cards[1])
    gsap.to(cards[1], { x: -35, rotate: 2, duration: 0.85, ease: 'power2.out', overwrite: 'auto' })
}

const hoverRightEnter = () => {
  if (isFlipped.value || !isDesktop.value) return
  const cards = getCards()
  if (cards.length === 0) return

  gsap.set(cards[0], { transformOrigin: 'center center' })
  gsap.to(cards[0], {
    x: 180,
    rotateY: 60,
    rotateX: -15,
    rotate: 0,
    y: -20,
    scale: 1.05,
    duration: 0.85,
    ease: 'power2.out',
    overwrite: 'auto',
  })
  if (cards[1])
    gsap.to(cards[1], { x: 40, rotate: 9, duration: 0.85, ease: 'power2.out', overwrite: 'auto' })
}

const hoverLeaveReset = () => {
  if (isFlipped.value || !isDesktop.value) return
  const cards = getCards()
  if (cards.length === 0) return

  gsap.to(cards[0], {
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    rotate: 0,
    scale: 1,
    duration: 0.75,
    ease: 'power2.out',
    overwrite: 'auto',
  })
  if (cards[1])
    gsap.to(cards[1], { x: 0, rotate: 6.5, duration: 0.75, ease: 'power2.out', overwrite: 'auto' })
}

const swipeLeft = () => {
  if (isFlipped.value) {
    flipBack()
    setTimeout(executeSwipeLeft, 300)
  } else {
    executeSwipeLeft()
  }
}

const executeSwipeLeft = () => {
  const cardsDOM = getCards()
  if (cardsDOM.length === 0) return

  const topCardDOM = cardsDOM[0]
  const secondCardDOM = cardsDOM[1]
  const thirdCardDOM = cardsDOM[2]

  const duration = 0.85
  const ease = 'power3.inOut'

  if (secondCardDOM) {
    gsap.to(secondCardDOM, { x: 0, y: 0, scale: 1, rotate: 0, duration, ease, overwrite: 'auto' })
  }

  if (thirdCardDOM) {
    gsap.to(thirdCardDOM, {
      x: 0,
      y: 8,
      scale: 0.96,
      rotate: 6.5,
      duration,
      ease,
      overwrite: 'auto',
    })
  }

  gsap.to(topCardDOM, {
    x: -700,
    y: 250,
    rotate: -45,
    rotateX: 0,
    rotateY: 0,
    opacity: 0,
    duration,
    ease,
    overwrite: 'auto',
    onComplete: async () => {
      gsap.killTweensOf(topCardDOM)
      gsap.set(topCardDOM, { opacity: 0 })

      const topCardData = localList.value.shift()
      localList.value.push(topCardData)

      emit('on-swiped', localList.value[0])

      await nextTick()

      gsap.set(topCardDOM, { clearProps: 'x,y,rotate,opacity' })

      gsap.fromTo(
        topCardDOM,
        { x: 0, y: 0, scale: 0.9, rotate: 0, rotateX: 0, rotateY: 0, opacity: 0 },
        { y: 16, scale: 0.92, rotate: -7, opacity: 0.75, duration: 0.5, ease: 'power2.out' },
      )
    },
  })
}

const swipeRight = () => {
  if (isFlipped.value) return
  isFlipped.value = true

  const cardsDOM = getCards()
  if (cardsDOM.length === 0) return
  const topCardDOM = cardsDOM[0]

  gsap.to(topCardDOM, {
    x: 0,
    y: -10,
    rotateX: 0,
    rotateY: 180,
    scale: 1.05,
    rotate: 0,
    duration: 0.75,
    ease: 'back.out(1.1)',
    overwrite: 'auto',
  })
}

const flipBack = () => {
  isFlipped.value = false
  emit('on-flip-back')

  const cardsDOM = getCards()
  if (cardsDOM.length === 0) return
  const topCardDOM = cardsDOM[0]

  gsap.to(topCardDOM, {
    rotateY: 0,
    rotateX: 0,
    scale: 1,
    y: 0,
    x: 0,
    rotate: 0,
    duration: 0.7,
    ease: 'power2.out',
    overwrite: 'auto',
  })
}

const getImageUrl = (fileName) => {
  if (!fileName) return ''
  return new URL(`../../assets/images/${fileName}`, import.meta.url).href
}

defineExpose({ swipeLeft, swipeRight, hoverLeftEnter, hoverRightEnter, hoverLeaveReset })
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full max-w-[315px] h-[440px] lg:max-w-[350px] lg:h-[490px] perspective-container select-none"
  >
    <div
      v-for="(card, index) in visibleCards"
      :key="card.id"
      :class="[
        'absolute inset-0 rounded-[24px] transform-style-3d card-item border border-slate-100 bg-white',
      ]"
      :style="getCardStyle(index)"
    >
      <!-- 正面 -->
      <div
        class="absolute inset-0 p-5 lg:p-6 flex flex-col justify-between backface-hidden rounded-[24px] bg-white"
      >
        <div>
          <span
            class="inline-block px-3 py-1 bg-brand-lightblue text-brand-blue rounded-full text-xs font-normal uppercase tracking-wide"
          >
            # {{ card.category }}
          </span>
          <h2
            class="text-2xl md:text-3xl font-bold mt-4 lg:mt-6 leading-snug tracking-widest text-brand-darkgray"
          >
            {{ card.title }}
          </h2>
        </div>
        <div class="flex justify-center my-3 lg:my-4 h-50 lg:h-65 items-center overflow-hidden">
          <img
            :src="getImageUrl(card.image)"
            :alt="card.category"
            class="w-full h-full object-contain select-none pointer-events-none"
            draggable="false"
          />
        </div>
        <div
          class="text-center text-[11px] lg:text-sm text-brand-gray/40 font-medium tracking-wide"
        >
          點擊畫面左側跳過 | 右側揭曉
        </div>
      </div>

      <!-- 背面 -->
      <div
        class="absolute inset-0 p-5 lg:p-6 flex flex-col justify-between backface-hidden rotate-y-180 rounded-[24px] bg-white"
      >
        <div>
          <div class="flex justify-between items-center">
            <span
              class="inline-block px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-normal"
              >✦ 科普解答</span
            >
            <button
              @click.stop="flipBack"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-brand-gray hover:text-brand-orange hover:bg-slate-200 transition-colors duration-200 font-bold relative z-50"
            >
              ✕
            </button>
          </div>
          <p class="text-sm lg:text-base leading-loose mt-4 lg:mt-6 font-medium text-brand-gray">
            {{ card.content }}
          </p>
        </div>
        <div class="mt-4 border-t border-brand-gray/10 pt-2">
          <p class="text-[11px] text-brand-gray/60 leading-normal text-center tracking-tighter">
            ⚠ 內容僅供科普參考，毛孩若有不適請務必優先諮詢專業獸醫師
          </p>
          <div class="text-sm text-brand-orange/60 font-medium text-center mt-2">
            — PawPal 陪你更懂毛孩 —
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective-container {
  perspective: 1000px;
}
.transform-style-3d {
  transform-style: preserve-3d;
}
.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
.card-item {
  will-change: transform;
}
</style>
