<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import petPhoto from '@/assets/images/dog.png'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  pet: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

const petImage = computed(
  () => props.pet?.photoUrl || props.pet?.image || props.pet?.avatar_url || props.pet?.avatarUrl || petPhoto,
)

const formatValue = (value) => {
  if (value === '' || value == null) return '-'
  return value
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen && pet"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <section
        class="modal-card relative flex max-h-[90vh] w-full max-w-3xl flex-col gap-6 overflow-y-auto rounded-3xl bg-white p-6 text-brand-navy shadow-2xl md:p-8"
      >
        <button
          type="button"
          class="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-lg text-brand-gray transition duration-200 hover:bg-brand-blue/20 hover:text-brand-navy active:scale-95"
          aria-label="關閉"
          @click="emit('close')"
        >
          ⨉
        </button>

        <div class="grid gap-7 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
          <aside class="flex flex-col items-center text-center md:items-start md:text-left">
            <div
              class="h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-brand-lightblue shadow-[0_10px_24px_rgba(61,74,122,0.16)] md:h-40 md:w-40"
            >
              <img
                :src="petImage"
                :alt="`${pet.name || '寵物'}照片`"
                class="h-full w-full object-cover"
              />
            </div>

            <div class="mt-6 space-y-1">
              <h2 class="text-3xl font-bold tracking-wide text-brand-navy">
                {{ formatValue(pet.name) }}
              </h2>
              <p class="text-base font-medium text-brand-gray">{{ formatValue(pet.breed) }}</p>
              <p class="text-base font-medium text-brand-gray">{{ formatValue(pet.gender) }}</p>
              <p class="text-base font-medium text-brand-gray">
                {{ formatValue(pet.age) }}
                <span v-if="pet.birthday">（{{ pet.birthday }}）</span>
              </p>
            </div>
          </aside>

          <div class="min-w-0 space-y-1 pt-1">
            <dl class="divide-y divide-slate-200 text-base">
              <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-3">
                <dt class="font-bold text-brand-navy">體重：</dt>
                <dd class="text-brand-darkgray">{{ formatValue(pet.weight) }} kg</dd>
              </div>
              <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-3">
                <dt class="font-bold text-brand-navy">晶片號碼：</dt>
                <dd class="break-words text-brand-darkgray">{{ formatValue(pet.microchipNumber) }}</dd>
              </div>
              <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-3">
                <dt class="font-bold text-brand-navy">結紮狀態：</dt>
                <dd class="text-brand-darkgray">{{ pet.neutered ? '已結紮' : '未結紮' }}</dd>
              </div>
              <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-3">
                <dt class="font-bold text-brand-navy">血型：</dt>
                <dd class="text-brand-darkgray">{{ formatValue(pet.bloodType) }}</dd>
              </div>
              <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-3">
                <dt class="font-bold text-brand-navy">毛色：</dt>
                <dd class="text-brand-darkgray">{{ formatValue(pet.furColor) }}</dd>
              </div>
              <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-3">
                <dt class="font-bold text-brand-navy">備註：</dt>
                <dd class="break-words leading-relaxed text-brand-darkgray">
                  {{ formatValue(pet.note) }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="flex justify-end border-t border-slate-100 pt-4">
          <BaseButton variant="secondary" @click="emit('close')">取消</BaseButton>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-card,
.fade-leave-active .modal-card {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-enter-from .modal-card,
.fade-leave-to .modal-card {
  transform: scale(0.95);
}
</style>
