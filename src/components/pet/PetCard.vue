<script setup>
import { computed } from 'vue'

const props = defineProps({
  pet: {
    type: Object,
    default: null,
  },
  theme: {
    type: String,
    default: 'green',
    validator: (value) => ['green', 'orange', 'blue'].includes(value),
  },
})

const emit = defineEmits(['click'])

const themeClassMap = {
  green: 'bg-[var(--color-brand-green)]',
  orange: 'bg-[var(--color-brand-orange)]',
  blue: 'bg-[var(--color-brand-blue)]',
}

const cardThemeClass = computed(() => themeClassMap[props.theme] ?? themeClassMap.green)

const ageText = computed(() =>
  props.pet?.age === '' || props.pet?.age == null
    ? '-'
    : `${props.pet.age} ${props.pet?.ageUnit ?? '歲'}`,
)
</script>

<template>
  <article
    class="flex w-full cursor-pointer items-center gap-4 rounded-[28px] p-4 transition duration-200 active:scale-[0.99] md:max-w-[142px] md:flex-col md:items-center md:gap-3 md:px-5 md:py-6"
    :class="cardThemeClass"
    tabindex="0"
    role="button"
    @click="emit('click')"
    @keydown.enter.prevent="emit('click')"
    @keydown.space.prevent="emit('click')"
  >
    <div
      class="h-[74px] w-[74px] shrink-0 overflow-hidden rounded-full border-4 border-white bg-white md:h-[88px] md:w-[88px]"
    >
      <img :src="pet?.image" :alt="pet?.name || 'pet photo'" class="h-full w-full object-cover" />
    </div>

    <div class="min-w-0 text-left md:w-full md:text-center">
      <h3
        class="truncate text-[18px] font-black tracking-[0.18em] text-[var(--color-brand-darkgray)] md:text-[15px]"
      >
        {{ pet?.name || '未命名' }}
      </h3>
      <div
        class="mt-2 grid max-w-full grid-cols-[2em_0.5rem_minmax(0,1fr)] gap-x-1 gap-y-1 text-[12px] font-medium text-[var(--color-brand-gray)] md:mt-1.5"
      >
        <span class="text-left">品種</span>
        <span aria-hidden="true">|</span>
        <span class="min-w-0 truncate text-left">{{ pet?.breed || '-' }}</span>
        <span class="text-left">年齡</span>
        <span aria-hidden="true">|</span>
        <span class="min-w-0 truncate text-left">{{ ageText }}</span>
      </div>
    </div>
  </article>
</template>
