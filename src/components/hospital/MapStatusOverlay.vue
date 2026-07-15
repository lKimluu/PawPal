<script setup>
defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  isTruncated: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['retry'])
</script>

<template>
  <div
    v-if="isLoading"
    class="absolute left-24 top-4 z-[500] w-fit max-w-[calc(100%-7rem)] rounded-full bg-white px-3 py-2 text-xs font-bold text-brand-gray shadow"
  >
    更新地圖中...
  </div>

  <div
    v-if="errorMessage"
    class="absolute left-24 top-4 z-[500] w-[calc(100%-7rem)] max-w-xs rounded-xl bg-white p-3 text-xs font-bold text-brand-orange shadow"
  >
    {{ errorMessage }}
    <button
      class="ml-2 underline transition active:scale-95 active:text-brand-navy"
      type="button"
      @click="emit('retry')"
    >
      重試
    </button>
  </div>

  <div
    v-if="isTruncated"
    class="absolute bottom-8 left-1/2 z-[500] -translate-x-1/2 rounded-full bg-brand-navy px-4 py-2 text-xs font-bold text-white shadow"
  >
    醫院較多，請放大地圖查看完整結果
  </div>
</template>
