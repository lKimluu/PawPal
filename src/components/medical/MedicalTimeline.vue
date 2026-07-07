<script setup>
import MedicalRecordCard from '@/components/medical/MedicalRecordCard.vue'

defineProps({
  records: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['edit-record', 'delete-record'])

const typeColorMap = {
  看診: '#92a8f5',
  疫苗: '#ffa002',
  手術: '#dd7e6b',
  用藥: '#74ef7e',
  體檢: '#d2a8ff',
  其他: '#ffa7e2',
}

const getTypeColor = (type) => {
  return typeColorMap[type] || '#92a8f5'
}
</script>

<template>
  <div class="w-full px-2 py-4 md:px-6 md:py-6">
    <div class="relative w-full pb-8">
      <div
        class="absolute top-2 bottom-0 left-[7px] md:left-[148px] w-[2px] bg-brand-blue/30 z-0"
        aria-hidden="true"
      ></div>
      <div class="space-y-8">
        <div
          v-for="record in records"
          :key="record.id"
          class="relative z-10 grid grid-cols-1 md:grid-cols-[120px_24px_1fr] md:gap-4 items-start"
        >
          <div
            class="hidden md:block text-right text-base font-medium text-brand-gray/80 pt-0.5 pr-1 tracking-wide"
          >
            {{ record.recordDate }}
          </div>
          <div class="flex items-center gap-3 md:justify-center md:mt-1 mb-2.5 md:mb-0">
            <div
              class="w-4 h-4 shrink-0 rounded-full border-4 border-white shadow-sm transition-colors duration-300"
              :style="{ backgroundColor: getTypeColor(record.recordType) }"
              aria-hidden="true"
            ></div>
            <div class="md:hidden flex flex-wrap items-center gap-2 text-sm text-brand-gray">
              <span class="pl-2 font-medium text-brand-gray/80">{{ record.recordDate }}</span>
              <span
                class="px-1.5 py-0.5 text-xs text-brand-white rounded-md font-bold transition-colors duration-300"
                :style="{ backgroundColor: getTypeColor(record.recordType) }"
              >
                {{ record.recordType }}
              </span>
              <span class="text-brand-navy font-medium truncate max-w-[150px]">
                {{ record.title }}
              </span>
            </div>
          </div>
          <div class="pl-7 md:pl-0 w-full min-w-0">
            <div
              class="hidden md:flex items-center justify-between gap-2 mb-3 text-base text-brand-navy w-full"
            >
              <div class="flex items-center gap-2">
                <span
                  class="inline-block px-2 py-0.5 text-xs text-white rounded-md font-bold tracking-wide transition-colors duration-300"
                  :style="{ backgroundColor: getTypeColor(record.recordType) }"
                >
                  {{ record.recordType }}
                </span>
                <span class="font-bold text-[#3D4A7A] text-[17px]">{{ record.hospitalName }}</span>
                <span class="text-slate-300 font-light" v-if="record.hospitalName && record.title"
                  >|</span
                >
                <span class="text-brand-navy font-medium">{{ record.title }}</span>
              </div>
              <div class="flex items-center gap-1 pr-2 shrink-0">
                <button
                  @click="emit('edit-record', record)"
                  type="button"
                  class="flex h-7 w-9 cursor-pointer items-center justify-center rounded-full transition hover:bg-brand-blue/15 active:scale-95"
                >
                  <img class="w-5 h-5" src="@/assets/icons/edit_b.svg" alt="編輯" />
                </button>
                <button
                  @click="emit('delete-record', record)"
                  type="button"
                  class="flex h-7 w-9 cursor-pointer items-center justify-center rounded-full transition hover:bg-red-500/15 active:scale-95"
                >
                  <img class="w-5 h-5" src="@/assets/icons/delete_r.svg" alt="刪除" />
                </button>
              </div>
            </div>
            <MedicalRecordCard
              :record="record"
              @edit-record="(rec) => emit('edit-record', rec)"
              @delete-record="(rec) => emit('delete-record', rec)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
