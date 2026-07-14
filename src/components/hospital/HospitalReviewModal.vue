<script setup>
import { computed, ref, watch } from 'vue'
import deleteIcon from '@/assets/icons/delete_r.svg'
import editIcon from '@/assets/icons/edit_b.svg'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  hospital: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'list',
    validator: (value) => ['list', 'form'].includes(value),
  },
  reviews: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  currentUserId: {
    type: [Number, String],
    default: null,
  },
  editingReview: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'submit', 'start-review', 'cancel-form', 'edit-review', 'delete-review'])

const selectedRating = ref(0)
const hoverRating = ref(0)
const comment = ref('')

const averageRating = computed(() => Number(props.hospital?.rating ?? 0).toFixed(1))
const reviewCount = computed(() => Number(props.hospital?.reviewCount ?? 0))
const canSubmit = computed(() => selectedRating.value >= 1 && comment.value.trim().length > 0)
const hasReviews = computed(() => props.reviews.length > 0)
const activeRating = computed(() => hoverRating.value || selectedRating.value)
const submitButtonLabel = computed(() => (props.editingReview ? '儲存修改' : '送出評論'))

function resetForm() {
  selectedRating.value = 0
  hoverRating.value = 0
  comment.value = ''
}

function fillFormFromReview(review) {
  selectedRating.value = Number(review?.rating ?? 0)
  hoverRating.value = 0
  comment.value = review?.comment ?? ''
}

function handleClose() {
  resetForm()
  emit('close')
}

function handleCancelForm() {
  resetForm()
  emit('cancel-form')
}

function handleSubmit() {
  if (!canSubmit.value || props.isSubmitting) return

  emit('submit', {
    reviewId: props.editingReview?.id ?? null,
    rating: selectedRating.value,
    comment: comment.value.trim(),
  })
}

function canManageReview(review) {
  if (review?.can_edit || review?.canEdit) return true
  if (!props.currentUserId || !review?.user_id) return false

  return String(review.user_id) === String(props.currentUserId)
}

function reviewUserName(review) {
  return review.user_name || review.userName || review.user?.name || '匿名飼主'
}

function normalizeReviewTimestamp(value) {
  if (typeof value !== 'string') return value

  const timestamp = value.trim()
  if (!timestamp || /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp)) return timestamp
  if (!/[T ]\d{2}:\d{2}/.test(timestamp)) return timestamp

  return `${timestamp.replace(' ', 'T')}Z`
}

function formatReviewTime(value) {
  const date = new Date(normalizeReviewTimestamp(value))
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Taipei',
  }).format(date)
}

watch(
  () => [props.isOpen, props.mode, props.editingReview?.id],
  ([isOpen, mode]) => {
    if (!isOpen || mode !== 'form') {
      resetForm()
      return
    }

    if (props.editingReview) fillFormFromReview(props.editingReview)
    else resetForm()
  },
)
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    title="醫院評論"
    subtitle="分享你的看診體驗，幫助其他飼主選擇合適的醫院"
    @close="handleClose"
  >
    <div
      v-if="mode === 'list'"
      class="flex min-h-0 flex-col gap-5 overflow-y-auto pr-4 md:pr-6"
    >
      <div class="rounded-2xl bg-brand-lightblue/50 px-4 py-3">
        <h3 class="text-lg font-bold text-brand-navy">{{ hospital?.name || '醫院' }}</h3>
        <p class="mt-1 text-sm font-semibold text-brand-gray">
          ★ {{ averageRating }}（{{ reviewCount }} 則評論）
        </p>
      </div>

      <div v-if="isLoading" class="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-brand-gray">
        評論載入中...
      </div>

      <div v-else-if="!hasReviews" class="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-brand-gray">
        目前尚無評論，成為第一個分享看診經驗的人吧！
      </div>

      <div v-else class="flex flex-col gap-3">
        <article
          v-for="review in reviews"
          :key="review.id"
          class="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
        >
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-sm font-bold text-brand-navy">{{ reviewUserName(review) }}</p>
              <div class="mt-1 flex items-center gap-0.5" :aria-label="`${review.rating} 星評分`">
                <span
                  v-for="star in 5"
                  :key="star"
                  class="text-base leading-none"
                  :class="Number(review.rating) >= star ? 'text-brand-orange' : 'text-slate-300'"
                  aria-hidden="true"
                >
                  ★
                </span>
              </div>
            </div>
            <div class="flex items-center justify-between gap-2 sm:justify-end">
              <time class="text-xs font-medium text-brand-gray" :datetime="review.created_at">
                {{ formatReviewTime(review.created_at) }}
              </time>
              <div v-if="canManageReview(review)" class="flex items-center gap-1">
                <button
                  type="button"
                  class="flex h-7 w-8 cursor-pointer items-center justify-center rounded-full transition hover:bg-brand-blue/15 active:scale-95"
                  title="編輯"
                  aria-label="編輯評論"
                  @click="emit('edit-review', review)"
                >
                  <img class="h-4 w-4" :src="editIcon" alt="編輯" />
                </button>
                <button
                  type="button"
                  class="flex h-7 w-8 cursor-pointer items-center justify-center rounded-full transition hover:bg-red-500/15 active:scale-95"
                  title="刪除"
                  aria-label="刪除評論"
                  @click="emit('delete-review', review)"
                >
                  <img class="h-4 w-4" :src="deleteIcon" alt="刪除" />
                </button>
              </div>
            </div>
          </div>
          <p class="mt-3 whitespace-pre-line text-sm leading-6 text-brand-darkgray">
            {{ review.comment }}
          </p>
        </article>
      </div>

      <div class="mt-2 flex items-center justify-end border-t border-slate-100 pt-4">
        <button
          type="button"
          class="cursor-pointer rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition duration-200 hover:bg-[#7b94ee] active:scale-95"
          @click="emit('start-review')"
        >
          填寫評論
        </button>
      </div>
    </div>

    <form
      v-else
      class="flex min-h-0 flex-col gap-5 overflow-y-auto pr-4 md:pr-6"
      @submit.prevent="handleSubmit"
    >
      <div class="rounded-2xl bg-brand-lightblue/50 px-4 py-3">
        <h3 class="text-lg font-bold text-brand-navy">{{ hospital?.name || '醫院' }}</h3>
        <p class="mt-1 text-sm font-semibold text-brand-gray">
          ★ {{ averageRating }}（{{ reviewCount }} 則評論）
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-base font-bold text-brand-navy">
          星級評分 <span class="font-normal text-red-600">*</span>
        </label>
        <div class="flex items-center gap-2" role="radiogroup" aria-label="星級評分">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-2xl transition active:scale-95"
            :class="activeRating >= star ? 'bg-orange-50 text-brand-orange' : 'bg-slate-100 text-slate-300'"
            :aria-label="`${star} 星`"
            @mouseenter="hoverRating = star"
            @mouseleave="hoverRating = 0"
            @click="selectedRating = star"
          >
            ★
          </button>
          <span class="ml-1 text-sm font-semibold text-brand-gray">
            {{ selectedRating ? `已選擇 ${selectedRating} 星` : '請選擇評分' }}
          </span>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-base font-bold text-brand-navy">
          評論內容 <span class="font-normal text-red-600">*</span>
        </label>
        <textarea
          v-model="comment"
          rows="5"
          placeholder="請輸入您對這間醫院的評論"
          class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-darkgray placeholder-brand-gray/50 outline-none transition duration-200 hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
        ></textarea>
      </div>

      <div class="mt-2 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          class="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-700 active:scale-95"
          @click="handleCancelForm"
        >
          取消
        </button>
        <button
          type="submit"
          class="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md transition duration-200 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white disabled:shadow-none disabled:active:scale-100"
          :class="canSubmit && !isSubmitting ? 'cursor-pointer bg-brand-blue shadow-brand-blue/20 hover:bg-[#7b94ee]' : 'bg-slate-300'"
          :disabled="!canSubmit || isSubmitting"
        >
          {{ isSubmitting ? '送出中...' : submitButtonLabel }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
