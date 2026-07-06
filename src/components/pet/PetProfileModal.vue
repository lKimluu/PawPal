<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import petPhoto from '@/assets/images/dog.png'
import { formatPetBirthday, formatPetGender } from '@/utils/petDisplay.js'

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

const isEditingProfile = ref(false)
const editForm = ref(createEditForm())

const petImage = computed(
  () => props.pet?.photoUrl || props.pet?.image || props.pet?.avatar_url || props.pet?.avatarUrl || petPhoto,
)

const weightInputStyle = computed(() => {
  const valueLength = String(editForm.value.weight ?? '').length

  return {
    width: `${Math.max(valueLength, 1)}ch`,
  }
})

const inlineInputClass =
  'h-6 py-0 leading-6 min-w-0 rounded-none border-0 border-b border-transparent bg-transparent px-0 text-base font-normal text-brand-darkgray outline-none transition hover:border-brand-blue/30 focus:border-brand-blue focus:bg-transparent focus:ring-0'
const inlineTextareaClass = `${inlineInputClass} h-12 w-full resize-none leading-relaxed`
const nameInputClass =
  'block h-9 py-0 leading-9 mx-auto min-w-0 rounded-none border-0 border-b border-transparent bg-transparent px-0 text-center text-3xl font-bold tracking-wide text-brand-navy outline-none transition hover:border-brand-blue/30 focus:border-brand-blue focus:bg-transparent focus:ring-0 md:mx-0 md:text-left'
const detailInputClass = `${inlineInputClass} font-medium`
const profilePhotoClass =
  'h-36 w-36 shrink-0 overflow-hidden rounded-full border-4 border-white bg-brand-lightblue shadow-[0_10px_24px_rgba(61,74,122,0.16)] md:h-40 md:w-40'
const profileSummaryClass = 'mt-6 w-full space-y-1'
const profileMetaTextClass = 'text-base font-medium text-brand-gray'
const profileMetaInputClass =
  'block h-6 py-0 leading-6 mx-auto min-w-0 rounded-none border-0 border-b border-transparent bg-transparent px-0 text-center text-base font-medium text-brand-gray outline-none transition hover:border-brand-blue/30 focus:border-brand-blue focus:bg-transparent focus:ring-0 md:mx-0 md:text-left'
const profileBirthdayInputClass =
  'inline-block h-6 w-[7.5rem] min-w-0 rounded-none border-0 border-b border-transparent bg-transparent px-0 py-0 text-center text-base font-medium leading-6 text-brand-gray outline-none transition hover:border-brand-blue/30 focus:border-brand-blue focus:bg-transparent focus:ring-0 md:text-left'
const profileSelectClass =
  'block h-6 appearance-none rounded-none border-0 border-b border-transparent bg-transparent px-0 py-0 pr-5 text-base font-medium leading-6 text-brand-gray outline-none transition hover:border-brand-blue/30 focus:border-brand-blue focus:bg-transparent focus:ring-0'

const petGender = computed(() => formatPetGender(props.pet?.gender))
const petBirthday = computed(() => formatPetBirthday(props.pet?.birthday))

function formatValue(value) {
  if (value === '' || value == null) return '-'
  return value
}

function normalizeGender(value) {
  if (value === 'male') return '公'
  if (value === 'female') return '母'
  return value ?? ''
}

function formatBirthdayForDateInput(value) {
  if (!value) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  return year && month && day ? `${year}-${month}-${day}` : ''
}

function createEditForm() {
  const pet = props?.pet ?? {}

  return {
    name: pet.name ?? '',
    breed: pet.breed ?? '',
    gender: normalizeGender(pet.gender),
    birthday: formatBirthdayForDateInput(pet.birthday),
    weight: pet.weight ?? '',
    microchipNumber: pet.microchipNumber ?? pet.microchip_number ?? '',
    neutered: pet.neutered ? '已結紮' : '未結紮',
    bloodType: pet.bloodType ?? pet.blood_type ?? '',
    furColor: pet.furColor ?? pet.fur_color ?? '',
    note: pet.note ?? pet.notes ?? '',
  }
}

function resetEditForm() {
  editForm.value = createEditForm()
}

function handleStartEdit() {
  resetEditForm()
  isEditingProfile.value = true
}

function handleCancelEdit() {
  resetEditForm()
  isEditingProfile.value = false
}

function handleSaveEdit() {
  isEditingProfile.value = false
}

function handleClose() {
  isEditingProfile.value = false
  emit('close')
}

watch(
  () => [props.isOpen, props.pet],
  () => {
    resetEditForm()
    isEditingProfile.value = false
  },
)
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen && pet"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <section
        class="modal-card relative flex h-[450px] max-h-[90vh] w-full max-w-3xl flex-col gap-5 overflow-hidden rounded-3xl bg-white p-6 text-brand-navy shadow-2xl md:p-8"
      >
        <button
          type="button"
          class="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-lg text-brand-gray transition duration-200 hover:bg-brand-blue/20 hover:text-brand-navy active:scale-95"
          aria-label="關閉"
          @click="handleClose"
        >
          ⨉
        </button>

        <div class="grid grid-cols-1 auto-rows-max gap-6 overflow-y-auto overflow-x-hidden pr-1 md:min-h-0 md:flex-1 md:auto-rows-auto md:grid-cols-[260px_minmax(0,1fr)] md:items-start md:overflow-hidden md:pr-0">
          <aside class="flex flex-col items-center text-center md:min-h-0 md:items-start md:text-left">
            <div :class="profilePhotoClass">
              <img
                :src="petImage"
                :alt="`${pet.name || '寵物'}照片`"
                class="h-full w-full object-cover"
              />
            </div>

            <div :class="profileSummaryClass">
              <h2 v-if="!isEditingProfile" class="text-3xl font-bold tracking-wide text-brand-navy">
                {{ formatValue(pet.name) }}
              </h2>
              <input
                v-else
                v-model="editForm.name"
                type="text"
                :class="`${nameInputClass} w-full max-w-[180px]`"
                aria-label="寵物名稱"
              />

              <p v-if="!isEditingProfile" :class="profileMetaTextClass">
                {{ formatValue(pet.breed) }}
              </p>
              <input
                v-else
                v-model="editForm.breed"
                type="text"
                :class="`${profileMetaInputClass} w-full max-w-[180px]`"
                aria-label="品種"
              />

              <p v-if="!isEditingProfile" :class="profileMetaTextClass">
                {{ petGender }}
              </p>
              <select
                v-else
                v-model="editForm.gender"
                :class="`${profileSelectClass} mx-auto w-full max-w-[180px] pr-0 text-center [text-align-last:center] md:mx-0 md:pr-5 md:text-left md:[text-align-last:left]`"
                aria-label="性別"
              >
                <option value="公">公</option>
                <option value="母">母</option>
                <option value="未知">未知</option>
              </select>

              <p v-if="!isEditingProfile" :class="profileMetaTextClass">
                {{ formatValue(pet.age) }}
                <span v-if="pet.birthday">（{{ petBirthday }}）</span>
              </p>
              <div
                v-else
                :class="`${profileMetaTextClass} flex h-6 items-center justify-center gap-1 md:justify-start`"
              >
                <span v-if="pet.age">{{ formatValue(pet.age) }}</span>
                <span v-if="pet.age">（</span>
                <input
                  v-model="editForm.birthday"
                  type="date"
                  :class="profileBirthdayInputClass"
                  aria-label="生日"
                />
                <span v-if="pet.age">）</span>
              </div>
            </div>
          </aside>

          <div class="min-h-0 min-w-0 space-y-1 overflow-visible pt-1 md:overflow-y-auto md:pr-1">
            <dl class="divide-y divide-slate-200 text-base">
              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4 py-2">
                <dt class="font-bold text-brand-navy">體重：</dt>
                <dd v-if="!isEditingProfile" class="text-brand-darkgray">{{ formatValue(pet.weight) }} kg</dd>
                <dd v-else class="flex min-w-0 items-center gap-0 text-brand-darkgray">
                  <input
                    v-model="editForm.weight"
                    type="text"
                    :class="`${detailInputClass} min-w-[1ch] max-w-[8ch]`"
                    :style="weightInputStyle"
                    aria-label="體重"
                  />
                  <span>kg</span>
                </dd>
              </div>

              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4 py-2">
                <dt class="font-bold text-brand-navy">晶片號碼：</dt>
                <dd v-if="!isEditingProfile" class="break-words text-brand-darkgray">
                  {{ formatValue(pet.microchipNumber) }}
                </dd>
                <dd v-else class="min-w-0">
                  <input
                    v-model="editForm.microchipNumber"
                    type="text"
                    :class="`${detailInputClass} w-full max-w-[210px]`"
                    aria-label="晶片號碼"
                  />
                </dd>
              </div>

              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4 py-2">
                <dt class="font-bold text-brand-navy">結紮狀態：</dt>
                <dd v-if="!isEditingProfile" class="text-brand-darkgray">
                  {{ pet.neutered ? '已結紮' : '未結紮' }}
                </dd>
                <dd v-else class="min-w-0">
                  <select
                    v-model="editForm.neutered"
                    :class="`${profileSelectClass} w-full max-w-[110px] text-brand-darkgray`"
                    aria-label="結紮狀態"
                  >
                    <option value="已結紮">已結紮</option>
                    <option value="未結紮">未結紮</option>
                  </select>
                </dd>
              </div>

              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4 py-2">
                <dt class="font-bold text-brand-navy">血型：</dt>
                <dd v-if="!isEditingProfile" class="text-brand-darkgray">{{ formatValue(pet.bloodType) }}</dd>
                <dd v-else class="min-w-0">
                  <input
                    v-model="editForm.bloodType"
                    type="text"
                    :class="`${detailInputClass} w-full max-w-[120px]`"
                    aria-label="血型"
                  />
                </dd>
              </div>

              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4 py-2">
                <dt class="font-bold text-brand-navy">毛色：</dt>
                <dd v-if="!isEditingProfile" class="text-brand-darkgray">{{ formatValue(pet.furColor) }}</dd>
                <dd v-else class="min-w-0">
                  <input
                    v-model="editForm.furColor"
                    type="text"
                    :class="`${detailInputClass} w-full max-w-[120px]`"
                    aria-label="毛色"
                  />
                </dd>
              </div>

              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-4 py-2">
                <dt class="font-bold text-brand-navy">備註：</dt>
                <dd v-if="!isEditingProfile" class="break-words leading-relaxed text-brand-darkgray">
                  {{ formatValue(pet.note) }}
                </dd>
                <dd v-else class="min-w-0">
                  <textarea
                    v-model="editForm.note"
                    rows="2"
                    :class="inlineTextareaClass"
                    aria-label="備註"
                  ></textarea>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="flex justify-end gap-3 border-t border-slate-100 pt-3">
          <BaseButton v-if="!isEditingProfile" @click="handleStartEdit">修改資料</BaseButton>
          <template v-else>
            <BaseButton variant="secondary" @click="handleCancelEdit">取消</BaseButton>
            <BaseButton @click="handleSaveEdit">儲存修改</BaseButton>
          </template>
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
