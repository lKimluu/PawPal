<script setup>
import { computed } from 'vue'

const props = defineProps({
  pet: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['click'])

const hasPetImage = computed(() => props.pet?.hasCustomPhoto !== false && Boolean(props.pet?.image))
</script>

<template>
  <button
    type="button"
    class="flex shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-1 transition cursor-pointer active:scale-95 lg:hover:bg-brand-lightblue/60 md:gap-1 lg:gap-2"
    @click="emit('click')"
  >
    <div
      class="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-brand-lightblue transition md:h-12 md:w-12 lg:h-14 lg:w-14"
    >
      <img
        v-if="hasPetImage"
        :src="pet?.image"
        :alt="pet?.name || 'pet photo'"
        class="h-full w-full object-cover"
      />
      <svg
        v-else
        class="h-full w-full p-2 text-brand-blue/50"
        viewBox="0 0 640 640"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M298.5 156.9C312.8 199.8 298.2 243.1 265.9 253.7C233.6 264.3 195.8 238.1 181.5 195.2C167.2 152.3 181.8 109 214.1 98.4C246.4 87.8 284.2 114 298.5 156.9zM164.4 262.6C183.3 295 178.7 332.7 154.2 346.7C129.7 360.7 94.5 345.8 75.7 313.4C56.9 281 61.4 243.3 85.9 229.3C110.4 215.3 145.6 230.2 164.4 262.6zM133.2 465.2C185.6 323.9 278.7 288 320 288C361.3 288 454.4 323.9 506.8 465.2C510.4 474.9 512 485.3 512 495.7L512 497.3C512 523.1 491.1 544 465.3 544C453.8 544 442.4 542.6 431.3 539.8L343.3 517.8C328 514 312 514 296.7 517.8L208.7 539.8C197.6 542.6 186.2 544 174.7 544C148.9 544 128 523.1 128 497.3L128 495.7C128 485.3 129.6 474.9 133.2 465.2zM485.8 346.7C461.3 332.7 456.7 295 475.6 262.6C494.5 230.2 529.6 215.3 554.1 229.3C578.6 243.3 583.2 281 564.3 313.4C545.4 345.8 510.3 360.7 485.8 346.7zM374.1 253.7C341.8 243.1 327.2 199.8 341.5 156.9C355.8 114 393.6 87.8 425.9 98.4C458.2 109 472.8 152.3 458.5 195.2C444.2 238.1 406.4 264.3 374.1 253.7z"
        />
      </svg>
    </div>
    <span
      class="max-w-[64px] truncate text-sm text-brand-gray md:max-w-[72px] lg:max-w-[84px]"
    >
      {{ pet?.name || '未命名' }}
    </span>
  </button>
</template>
