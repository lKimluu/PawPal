<script setup>
import HospitalCard from '@/components/hospital/HospitalCard.vue'
import HospitalListState from '@/components/hospital/HospitalListState.vue'

defineProps({
  hospitals: {
    type: Array,
    default: () => [],
  },
  selectedHospitalId: {
    type: [String, Number],
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  isEmpty: {
    type: Boolean,
    default: false,
  },
  requiresLogin: {
    type: Boolean,
    default: false,
  },
  pagination: { type: Object, default: () => ({ page: 1, totalPages: 0 }) },
})

const emit = defineEmits(['selectHospital', 'retry', 'pageChange', 'reviewHospital', 'loginRequired'])
</script>

<template>
  <div class="w-full flex flex-col bg-transparent">
    <HospitalListState v-if="isLoading" type="loading" message="醫院資料載入中..." />

    <HospitalListState
      v-else-if="errorMessage"
      type="error"
      :message="errorMessage"
      :action-label="requiresLogin ? '前往登入' : '重新查詢'"
      @action="requiresLogin ? emit('loginRequired') : emit('retry')"
    />

    <HospitalListState v-else-if="isEmpty" type="empty" message="目前沒有符合條件的醫院。" />

    <div v-else class="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
      <HospitalCard
        v-for="item in hospitals"
        :key="item.id"
        :hospital="item"
        :is-selected="item.id === selectedHospitalId"
        @click="emit('selectHospital', item.id)"
        @review-hospital="emit('reviewHospital', item)"
      />
    </div>
    <nav
      v-if="!isLoading && !errorMessage && pagination.totalPages > 1"
      class="mt-4 flex items-center justify-center gap-3 text-sm font-bold"
    >
      <button
        class="cursor-pointer transition active:scale-95 active:text-brand-orange disabled:text-brand-gray disabled:active:scale-100"
        :disabled="pagination.page <= 1"
        @click="emit('pageChange', pagination.page - 1)"
      >
        上一頁
      </button>
      <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
      <button
        class="cursor-pointer transition active:scale-95 active:text-brand-orange disabled:text-brand-gray disabled:active:scale-100"
        :disabled="pagination.page >= pagination.totalPages"
        @click="emit('pageChange', pagination.page + 1)"
      >
        下一頁
      </button>
    </nav>
  </div>
</template>
