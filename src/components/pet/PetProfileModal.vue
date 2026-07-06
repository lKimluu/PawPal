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
const weightInputRef = ref(null)

const petImage = computed(
  () => props.pet?.photoUrl || props.pet?.image || props.pet?.avatar_url || props.pet?.avatarUrl || petPhoto,
)

const profileFieldBaseClass =
  'mx-auto w-full max-w-[250px] rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-center transition duration-200'
const profileReadonlyFieldClass =
  `${profileFieldBaseClass} flex min-h-10 items-center justify-center text-base font-medium text-brand-gray`
const profileEditableFieldClass =
  `${profileFieldBaseClass} min-h-10 text-base font-medium text-brand-gray outline-none hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10`
const profileNameReadonlyFieldClass =
  `${profileReadonlyFieldClass} min-h-12 text-3xl font-bold tracking-wide text-brand-navy`
const profileGenderReadonlyFieldClass =
  'mx-auto grid min-h-10 w-full max-w-[250px] place-items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-0 text-center text-base font-medium text-brand-gray transition duration-200'
const profileGenderSelectClass =
  'mx-auto min-h-10 w-full max-w-[250px] appearance-none rounded-2xl border border-slate-200 bg-slate-50/50 px-0 text-center text-base font-medium text-brand-gray outline-none transition duration-200 [text-align-last:center] hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10'
const profileAgeReadonlyFieldClass =
  `${profileReadonlyFieldClass} min-h-14 flex-wrap gap-x-3 gap-y-1 py-2 leading-snug`
const profileAgeEditableFieldClass =
  `${profileEditableFieldClass} min-h-14 flex items-center justify-center gap-x-3 gap-y-1 py-2 leading-snug`
const nameInputClass =
  `${profileEditableFieldClass} min-h-12 text-3xl font-bold tracking-wide text-brand-navy`
const detailFieldClass =
  'min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-base font-medium text-brand-darkgray transition duration-200'
const detailUnifiedWidthClass = 'max-w-[320px]'
const detailReadonlyFieldClass = `${detailFieldClass} ${detailUnifiedWidthClass} flex items-center break-words`
const detailEditableFieldClass = `${detailFieldClass} ${detailUnifiedWidthClass} outline-none hover:border-brand-blue hover:bg-brand-blue/5 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10`
const detailInlineInputClass =
  'min-w-0 border-0 bg-transparent p-0 text-base font-medium text-brand-darkgray outline-none placeholder-brand-gray/40 focus:ring-0'
const detailTextareaClass = `${detailEditableFieldClass} resize-none leading-relaxed`
const detailSelectClass = `${detailEditableFieldClass} appearance-none pr-10`
const profilePhotoClass =
  'h-36 w-36 shrink-0 overflow-hidden rounded-full border-4 border-white bg-brand-lightblue shadow-[0_10px_24px_rgba(61,74,122,0.16)] md:h-40 md:w-40'
const profileSummaryClass = 'mt-6 w-full space-y-2'
const profileMetaTextClass = profileReadonlyFieldClass
const profileMetaInputClass = profileEditableFieldClass
const profileBirthdayInputClass =
  'inline-block h-6 w-[7.5rem] min-w-0 rounded-none border-0 bg-transparent px-0 py-0 text-center text-base font-medium leading-6 text-brand-gray outline-none focus:ring-0 md:text-left'
const profileSelectClass =
  `${profileEditableFieldClass} block appearance-none py-0 pr-5`

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

function focusWeightInput() {
  weightInputRef.value?.focus()
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
        class="modal-card relative flex h-[540px] max-h-[90vh] w-full max-w-3xl flex-col gap-5 overflow-hidden rounded-3xl bg-white p-6 text-brand-navy shadow-2xl md:p-8"
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
          <aside class="flex flex-col items-center text-center md:min-h-0">
            <div :class="profilePhotoClass">
              <img
                :src="petImage"
                :alt="`${pet.name || '寵物'}照片`"
                class="h-full w-full object-cover"
              />
            </div>

            <div :class="profileSummaryClass">
              <h2 v-if="!isEditingProfile" :class="profileNameReadonlyFieldClass">
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

              <p v-if="!isEditingProfile" :class="profileGenderReadonlyFieldClass">
                {{ petGender }}
              </p>
              <select
                v-else
                v-model="editForm.gender"
                :class="profileGenderSelectClass"
                aria-label="性別"
              >
                <option value="公">公</option>
                <option value="母">母</option>
                <option value="未知">未知</option>
              </select>

              <p v-if="!isEditingProfile" :class="profileAgeReadonlyFieldClass">
                <span class="whitespace-nowrap">{{ formatValue(pet.age) }}</span>
                <span v-if="pet.birthday">{{ petBirthday }}</span>
              </p>
              <div
                v-else
                :class="profileAgeEditableFieldClass"
              >
                <span v-if="pet.age" class="whitespace-nowrap">{{ formatValue(pet.age) }}</span>
                <input
                  v-model="editForm.birthday"
                  type="date"
                  :class="profileBirthdayInputClass"
                  aria-label="生日"
                />
              </div>
            </div>
          </aside>

          <div class="min-h-0 min-w-0 space-y-1 overflow-visible pt-1 md:overflow-y-auto md:pr-1">
            <dl class="divide-y divide-slate-200 text-base">
              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4 py-2">
                <dt class="font-bold text-brand-navy">體重：</dt>
                <dd v-if="!isEditingProfile" :class="detailReadonlyFieldClass">
                  {{ formatValue(pet.weight) }} kg
                </dd>
                <dd
                  v-else
                  :class="`${detailEditableFieldClass} flex min-w-0 cursor-text items-center gap-1`"
                  @click="focusWeightInput"
                >
                  <input
                    ref="weightInputRef"
                    v-model="editForm.weight"
                    type="text"
                    :class="`${detailInlineInputClass} w-8`"
                    aria-label="體重"
                  />
                  <span>kg</span>
                </dd>
              </div>

              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4 py-2">
                <dt class="font-bold text-brand-navy">晶片號碼：</dt>
                <dd v-if="!isEditingProfile" :class="detailReadonlyFieldClass">
                  {{ formatValue(pet.microchipNumber) }}
                </dd>
                <dd v-else class="min-w-0">
                  <input
                    v-model="editForm.microchipNumber"
                    type="text"
                    :class="detailEditableFieldClass"
                    aria-label="晶片號碼"
                  />
                </dd>
              </div>

              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4 py-2">
                <dt class="font-bold text-brand-navy">結紮狀態：</dt>
                <dd v-if="!isEditingProfile" :class="detailReadonlyFieldClass">
                  {{ pet.neutered ? '已結紮' : '未結紮' }}
                </dd>
                <dd v-else class="min-w-0">
                  <select
                    v-model="editForm.neutered"
                    :class="detailSelectClass"
                    aria-label="結紮狀態"
                  >
                    <option value="已結紮">已結紮</option>
                    <option value="未結紮">未結紮</option>
                  </select>
                </dd>
              </div>

              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4 py-2">
                <dt class="font-bold text-brand-navy">血型：</dt>
                <dd v-if="!isEditingProfile" :class="detailReadonlyFieldClass">
                  {{ formatValue(pet.bloodType) }}
                </dd>
                <dd v-else class="min-w-0">
                  <input
                    v-model="editForm.bloodType"
                    type="text"
                    :class="detailEditableFieldClass"
                    aria-label="血型"
                  />
                </dd>
              </div>

              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4 py-2">
                <dt class="font-bold text-brand-navy">毛色：</dt>
                <dd v-if="!isEditingProfile" :class="detailReadonlyFieldClass">
                  {{ formatValue(pet.furColor) }}
                </dd>
                <dd v-else class="min-w-0">
                  <input
                    v-model="editForm.furColor"
                    type="text"
                    :class="detailEditableFieldClass"
                    aria-label="毛色"
                  />
                </dd>
              </div>

              <div class="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-4 py-2">
                <dt class="pt-2.5 font-bold text-brand-navy">備註：</dt>
                <dd v-if="!isEditingProfile" :class="`${detailReadonlyFieldClass} min-h-16 items-start leading-relaxed`">
                  {{ formatValue(pet.note) }}
                </dd>
                <dd v-else class="min-w-0">
                  <textarea
                    v-model="editForm.note"
                    rows="2"
                    :class="`${detailTextareaClass} min-h-16`"
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
