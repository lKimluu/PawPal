<script setup>
const emit = defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="flex cursor-pointer items-center gap-1 md:gap-1 rounded-full bg-brand-blue px-3 py-2 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 text-xs md:text-sm lg:text-base font-medium text-white transition hover:bg-[#7b94ee] active:scale-95"
    @click="emit('click')"
  >
    <img class="w-4 h-4 lg:w-5 lg:h-5" src="@/assets/icons/history.svg" alt="history" />
    歷史紀錄
  </button>
</template>
