<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'empty',
    validator: (value) => ['loading', 'error', 'empty'].includes(value),
  },
  message: {
    type: String,
    required: true,
  },
  actionLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['action'])

const panelClass = computed(() =>
  props.type === 'error'
    ? 'flex-col border-orange-100 text-center'
    : 'border-brand-lightblue text-center text-sm font-bold text-brand-gray',
)

const messageClass = computed(() =>
  props.type === 'error' ? 'text-sm font-bold text-brand-orange' : '',
)
</script>

<template>
  <div
    class="flex min-h-[220px] flex-1 items-center justify-center rounded-3xl border bg-white p-6"
    :class="panelClass"
    aria-live="polite"
  >
    <p :class="messageClass">{{ message }}</p>
    <button
      v-if="actionLabel"
      type="button"
      class="mt-4 rounded-full bg-brand-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-navy active:scale-95 active:bg-brand-navy"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
