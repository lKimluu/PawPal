<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  record: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['edit-record', 'delete-record'])
const images = computed(() => props.record?.image_url ?? [])

const isLightboxOpen = ref(false)
const activeImageIndex = ref(0)

const openLightbox = (index) => {
  activeImageIndex.value = index
  isLightboxOpen.value = true
}

const closeLightbox = () => {
  isLightboxOpen.value = false
}

const nextImage = () => {
  if (images.value.length === 0) return
  activeImageIndex.value = (activeImageIndex.value + 1) % images.value.length
}

const prevImage = () => {
  if (images.value.length === 0) return
  activeImageIndex.value = (activeImageIndex.value - 1 + images.value.length) % images.value.length
}
</script>

<template>
  <article
    class="relative flex w-full flex-col gap-6 rounded-2xl border border-black/5 bg-white p-6 pb-14 shadow-[0_8px_28px_rgba(31,41,55,0.08)] md:p-8 xl:flex-row xl:items-start xl:justify-between xl:gap-10 xl:p-10"
  >
    <div class="w-full min-w-0 xl:flex-1">
      <div class="space-y-1 md:space-y-2 lg:space-y-4">
        <div v-if="props.record?.symptoms">
          <p
            class="font-extrabold tracking-[0.08em] text-brand-navy text-sm md:text-base lg:text:lg"
          >
            症狀：
            <span
              class="ml-2 font-medium tracking-normal text-brand-darkgray whitespace-pre-line text-sm md:text-base lg:text:lg"
            >
              {{ props.record?.symptoms }}
            </span>
          </p>
        </div>

        <div v-if="props.record?.diagnosis">
          <p
            class="font-extrabold tracking-[0.08em] text-brand-navy text-sm md:text-base lg:text:lg"
          >
            診斷：
            <span
              class="ml-2 font-medium tracking-normal text-brand-darkgray text-sm md:text-base lg:text:lg whitespace-pre-line"
            >
              {{ props.record?.diagnosis }}
            </span>
          </p>
        </div>

        <div v-if="props.record?.prescription">
          <p
            class="font-extrabold tracking-[0.08em] text-brand-navy text-sm md:text-base lg:text:lg"
          >
            處方：
            <span
              class="ml-2 font-medium tracking-normal text-brand-darkgray text-sm md:text-base lg:text:lg whitespace-pre-line"
            >
              {{ props.record?.prescription }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="images.length > 0"
      class="flex w-full items-center gap-3 overflow-x-auto pb-2 pr-20 md:gap-4 md:pr-0 xl:w-auto xl:shrink-0 xl:pb-0"
    >
      <div
        v-for="(image, index) in images"
        :key="`${props.record?.id ?? 'record'}-${index}`"
        @click="openLightbox(index)"
        class="h-[110px] w-[84px] shrink-0 cursor-zoom-in overflow-hidden rounded-2xl bg-[#F5F7FB] ring-1 ring-black/5 transition hover:opacity-90 active:scale-98 md:h-[140px] md:w-[108px]"
      >
        <img
          :src="image"
          :alt="`${props.record?.title || 'medical record'} image ${index + 1}`"
          class="h-full w-full object-cover"
        />
      </div>
    </div>
    <div class="absolute right-4 bottom-4 flex items-center gap-2 md:hidden z-20">
      <button
        @click="emit('edit-record', props.record)"
        type="button"
        class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition active:bg-brand-blue/20 active:scale-95"
        title="編輯"
      >
        <img class="w-5 h-5" src="@/assets/icons/edit_b.svg" alt="編輯" />
      </button>
      <button
        @click="emit('delete-record', props.record)"
        type="button"
        class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition active:bg-red-500/20 active:scale-95"
        title="刪除"
      >
        <img class="w-5 h-5" src="@/assets/icons/delete_r.svg" alt="刪除" />
      </button>
    </div>
  </article>

  <Teleport to="body">
    <div
      v-if="isLightboxOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm select-none"
      @click.self="closeLightbox"
    >
      <button
        @click="closeLightbox"
        class="absolute top-4 right-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-brand-orange/50 text-xl text-white transition hover:bg-brand-orange/70 active:scale-95"
      >
        ✕
      </button>

      <button
        v-if="images.length > 1"
        @click="prevImage"
        class="absolute left-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 active:scale-95"
      >
        ‹
      </button>

      <div class="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-xl">
        <img
          :src="images[activeImageIndex]"
          alt="Maximized medical record"
          class="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl"
        />
        <div
          v-if="images.length > 1"
          class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white/80"
        >
          {{ activeImageIndex + 1 }} / {{ images.length }}
        </div>
      </div>

      <button
        v-if="images.length > 1"
        @click="nextImage"
        class="absolute right-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 active:scale-95"
      >
        ›
      </button>
    </div>
  </Teleport>
</template>
