<script setup>
import { nextTick, onMounted, ref } from 'vue'

defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['send'])

const inputText = ref('')
const scrollContainerRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const quickQuestions = ['貓咪一天要吃幾餐？', '狗狗多久洗一次澡比較好？', '毛孩情緒緊張怎麼安撫？']

function handleSend() {
  const text = inputText.value.trim()
  if (!text) return

  emit('send', text)
  inputText.value = ''
}

function handleQuickQuestion(question) {
  emit('send', question)
}

function updateScrollState() {
  const el = scrollContainerRef.value
  if (!el) return

  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function scrollQuestionsRight() {
  scrollContainerRef.value?.scrollBy({ left: 120, behavior: 'smooth' })
}

function scrollQuestionsLeft() {
  scrollContainerRef.value?.scrollBy({ left: -120, behavior: 'smooth' })
}

onMounted(async () => {
  await nextTick()
  updateScrollState()
})
</script>

<template>
  <div class="flex flex-col gap-3 border-t border-slate-100 pt-3">
    <div class="relative">
      <div
        ref="scrollContainerRef"
        class="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        :class="[canScrollLeft ? 'pl-10' : 'pl-0', canScrollRight ? 'pr-10' : 'pr-0']"
        @scroll="updateScrollState"
      >
        <button
          v-for="question in quickQuestions"
          :key="question"
          type="button"
          :disabled="isLoading"
          class="shrink-0 rounded-full border border-brand-lightblue bg-brand-lightblue/40 px-3 py-1.5 text-xs font-medium text-brand-navy transition duration-200 hover:bg-brand-lightblue disabled:cursor-not-allowed disabled:opacity-50"
          @click="handleQuickQuestion(question)"
        >
          {{ question }}
        </button>
      </div>

      <button
        v-if="canScrollLeft"
        type="button"
        aria-label="向左滑動查看更多快速提問"
        class="absolute inset-y-0 left-0 flex w-12 cursor-pointer items-center justify-start bg-gradient-to-r from-white from-60% to-transparent"
        @click="scrollQuestionsLeft"
      >
        <img src="@/assets/icons/chevron-right.svg" alt="" class="h-4 w-4 rotate-180" />
      </button>

      <button
        v-if="canScrollRight"
        type="button"
        aria-label="向右滑動查看更多快速提問"
        class="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-end bg-gradient-to-l from-white from-60% to-transparent"
        @click="scrollQuestionsRight"
      >
        <img src="@/assets/icons/chevron-right.svg" alt="" class="h-4 w-4" />
      </button>
    </div>

    <form class="flex items-center gap-2" @submit.prevent="handleSend">
      <input
        v-model="inputText"
        type="text"
        placeholder="請輸入您想詢問的問題..."
        :disabled="isLoading"
        class="flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-brand-darkgray placeholder-brand-gray/40 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        :disabled="isLoading || !inputText.trim()"
        class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-blue text-white shadow-md shadow-brand-blue/20 transition duration-200 hover:bg-[#7b94ee] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        aria-label="送出訊息"
      >
        <span class="text-lg">➤</span>
      </button>
    </form>
  </div>
</template>
