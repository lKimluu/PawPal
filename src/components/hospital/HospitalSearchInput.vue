<script setup>
import searchIcon from '@/assets/icons/search.svg'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])
</script>

<template>
  <label class="mt-3 flex h-11 items-center gap-2 rounded-xl bg-brand-lightblue/50 px-4">
    <img :src="searchIcon" alt="" class="h-4 w-4 opacity-70" />
    <input
      class="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
      type="search"
      :value="modelValue"
      placeholder="醫院名稱、地區、地址"
      @input="emit('update:modelValue', $event.target.value)"
      @keydown.enter.prevent="emit('submit')"
    />
    <button
      class="cursor-pointer text-xs font-bold text-brand-blue transition hover:text-brand-orange active:scale-95 active:text-brand-orange disabled:text-brand-gray disabled:active:scale-100"
      type="button"
      :disabled="isLoading"
      @click="emit('submit')"
    >
      搜尋
    </button>
  </label>
</template>
