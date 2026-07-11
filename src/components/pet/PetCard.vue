<script setup>
import { computed } from 'vue'
import { formatPetAge } from '@/utils/petDisplay.js'

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
  green: 'bg-[var(--color-brand-green)]/50',
  orange: 'bg-[var(--color-brand-orange)]/50',
  blue: 'bg-[var(--color-brand-blue)]/50',
}

const pawThemeClassMap = {
  green: 'text-[var(--color-brand-green)]/50',
  orange: 'text-[var(--color-brand-orange)]/50',
  blue: 'text-[var(--color-brand-blue)]/50',
}

const cardThemeClass = computed(() => themeClassMap[props.theme] ?? themeClassMap.green)
const pawThemeClass = computed(() => pawThemeClassMap[props.theme] ?? pawThemeClassMap.green)
const hasPetImage = computed(() => props.pet?.hasCustomPhoto !== false && Boolean(props.pet?.image))

const ageText = computed(() => {
  if (props.pet?.age !== '' && props.pet?.age != null) {
    return props.pet?.ageUnit ? `${props.pet.age} ${props.pet.ageUnit}` : props.pet.age
  }

  return formatPetAge(props.pet?.birthday)
})
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
      class="grid h-[74px] w-[74px] shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-white md:h-[88px] md:w-[88px]"
    >
      <img
        v-if="hasPetImage"
        :src="pet?.image"
        :alt="pet?.name || 'pet photo'"
        class="h-full w-full object-cover"
      />
      <svg
        v-else
        :class="pawThemeClass"
        class="h-12 w-12 md:h-14 md:w-14"
        viewBox="0 0 640 640"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M298.5 156.9C312.8 199.8 298.2 243.1 265.9 253.7C233.6 264.3 195.8 238.1 181.5 195.2C167.2 152.3 181.8 109 214.1 98.4C246.4 87.8 284.2 114 298.5 156.9zM164.4 262.6C183.3 295 178.7 332.7 154.2 346.7C129.7 360.7 94.5 345.8 75.7 313.4C56.9 281 61.4 243.3 85.9 229.3C110.4 215.3 145.6 230.2 164.4 262.6zM133.2 465.2C185.6 323.9 278.7 288 320 288C361.3 288 454.4 323.9 506.8 465.2C510.4 474.9 512 485.3 512 495.7L512 497.3C512 523.1 491.1 544 465.3 544C453.8 544 442.4 542.6 431.3 539.8L343.3 517.8C328 514 312 514 296.7 517.8L208.7 539.8C197.6 542.6 186.2 544 174.7 544C148.9 544 128 523.1 128 497.3L128 495.7C128 485.3 129.6 474.9 133.2 465.2zM485.8 346.7C461.3 332.7 456.7 295 475.6 262.6C494.5 230.2 529.6 215.3 554.1 229.3C578.6 243.3 583.2 281 564.3 313.4C545.4 345.8 510.3 360.7 485.8 346.7zM374.1 253.7C341.8 243.1 327.2 199.8 341.5 156.9C355.8 114 393.6 87.8 425.9 98.4C458.2 109 472.8 152.3 458.5 195.2C444.2 238.1 406.4 264.3 374.1 253.7z"
        />
      </svg>
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
