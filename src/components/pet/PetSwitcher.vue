<script setup>
const currentPetId = defineModel({
  type: Number,
  default: null,
})

defineProps({
  pets: {
    type: Array,
    required: true,
    default: () => [],
  },
})
</script>

<template>
  <div class="flex gap-0.5 overflow-x-auto px-1 py-2 md:gap-1 lg:gap-2 mb-4">
    <button
      v-for="pet in pets"
      :key="pet.id"
      type="button"
      class="flex shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-1 transition cursor-pointer lg:hover:bg-brand-lightblue/60 active:scale-95"
      @click="currentPetId = pet.id"
    >
      <div
        class="h-10 w-10 overflow-hidden rounded-full border-2 bg-brand-lightblue transition md:h-12 md:w-12 lg:h-14 lg:w-14"
        :class="
          currentPetId === pet.id
            ? 'border-brand-orange/50 shadow-[0_0_0_3px_rgba(255,160,2,0.25)]'
            : 'border-white'
        "
      >
        <img :src="pet.photoUrl" :alt="pet.name" class="h-full w-full object-cover" />
      </div>
      <span
        class="text-sm"
        :class="currentPetId === pet.id ? 'text-brand-orange' : 'text-brand-gray'"
      >
        {{ pet.name }}
      </span>
    </button>
  </div>
</template>
