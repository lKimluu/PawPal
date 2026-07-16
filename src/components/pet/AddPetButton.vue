<script setup>
const emit = defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="flex shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-1 transition cursor-pointer active:scale-95 lg:hover:bg-brand-orange/10"
    aria-label="新增寵物"
    @click="emit('click')"
  >
    <span
      class="grid h-10 w-10 place-items-center rounded-full border-2 border-dashed border-brand-orange bg-brand-orange/10 text-brand-orange transition md:h-12 md:w-12 lg:h-14 lg:w-14"
      aria-hidden="true"
    >
      <span class="relative block h-4 w-4 md:h-5 md:w-5">
        <span
          class="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-current"
        ></span>
        <span
          class="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 rounded-full bg-current"
        ></span>
      </span>
    </span>
    <span class="max-w-[64px] truncate text-sm text-brand-orange md:max-w-[72px] lg:max-w-[84px]">
      新增寵物
    </span>
  </button>
</template>
