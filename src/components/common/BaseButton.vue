<script setup>
defineProps({
  type: {
    type: String,
    default: 'button',
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'ghost'].includes(value),
  },
})

const variantClassMap = {
  primary:
    'bg-brand-blue text-white shadow-md shadow-brand-blue/20 hover:bg-[#7b94ee] hover:shadow-lg',
  secondary:
    'border border-slate-200 bg-white text-brand-gray hover:bg-brand-blue/10 hover:text-brand-navy',
  ghost: 'text-brand-gray hover:bg-slate-100 hover:text-brand-navy',
}
</script>

<template>
  <button
    :type="type"
    class="inline-flex cursor-pointer items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition duration-200 active:scale-95"
    :class="variantClassMap[variant]"
  >
    <slot />
  </button>
</template>
