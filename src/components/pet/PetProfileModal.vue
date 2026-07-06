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
  isSaving: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'update'])

const isEditing = ref(false)
const form = ref(createForm())

const petImage = computed(
  () => props.pet?.photoUrl || props.pet?.image || props.pet?.avatar_url || props.pet?.avatarUrl || petPhoto,
)

const petGender = computed(() => formatPetGender(props.pet?.gender))
const petBirthday = computed(() => formatPetBirthday(props.pet?.birthday))

const formatValue = (value) => {
  if (value === '' || value == null) return '-'
  return value
}

function createForm(pet = {}) {
  return {
    name: pet.name ?? '',
    species: pet.species ?? '',
    breed: pet.breed ?? '',
    gender: pet.gender ?? '',
    birthday: formatPetBirthday(pet.birthday) === '-' ? '' : formatPetBirthday(pet.birthday),
    weight: pet.weight ?? '',
    microchipNumber: pet.microchipNumber ?? pet.microchip_number ?? '',
    neutered: Boolean(pet.neutered),
    bloodType: pet.bloodType ?? pet.blood_type ?? '',
    furColor: pet.furColor ?? pet.fur_color ?? '',
    photoUrl: pet.photoUrl ?? pet.avatar_url ?? pet.avatarUrl ?? '',
    note: pet.note ?? pet.notes ?? '',
  }
}

function resetForm() {
  form.value = createForm(props.pet ?? {})
}

function handleClose() {
  isEditing.value = false
  resetForm()
  emit('close')
}

function startEditing() {
  resetForm()
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
  resetForm()
}

function handleSubmit() {
  emit('update', {
    id: props.pet?.id,
    data: { ...form.value },
  })
}

watch(
  () => [props.isOpen, props.pet],
  () => {
    resetForm()
    isEditing.value = false
  },
  { immediate: true },
)
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
          @click="handleClose"
        >
          ⨉
        </button>

        <form class="grid gap-7 md:grid-cols-[260px_minmax(0,1fr)] md:items-start" @submit.prevent="handleSubmit">
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

            <div v-if="!isEditing" class="mt-6 space-y-1">
              <h2 class="text-3xl font-bold tracking-wide text-brand-navy">
                {{ formatValue(pet.name) }}
              </h2>
              <p class="text-base font-medium text-brand-gray">{{ formatValue(pet.breed) }}</p>
              <p class="text-base font-medium text-brand-gray">{{ petGender }}</p>
              <p class="text-base font-medium text-brand-gray">
                {{ formatValue(pet.age) }}
                <span v-if="pet.birthday">（{{ petBirthday }}）</span>
              </p>
            </div>
            <div v-else class="mt-6 w-full space-y-3 text-left">
              <label class="block text-sm font-bold text-brand-navy">
                寵物照片網址
                <input
                  v-model="form.photoUrl"
                  type="url"
                  class="mt-2 h-11 w-full rounded-xl bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="https://example.com/pet.png"
                />
              </label>
            </div>
          </aside>

          <div class="min-w-0 space-y-1 pt-1">
            <dl v-if="!isEditing" class="divide-y divide-slate-200 text-base">
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
            <div v-else class="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
              <label class="text-sm font-bold text-brand-navy">
                寵物名稱
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="mt-2 h-11 w-full rounded-xl bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </label>
              <label class="text-sm font-bold text-brand-navy">
                物種
                <input
                  v-model="form.species"
                  type="text"
                  required
                  class="mt-2 h-11 w-full rounded-xl bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </label>
              <label class="text-sm font-bold text-brand-navy">
                品種
                <input
                  v-model="form.breed"
                  type="text"
                  class="mt-2 h-11 w-full rounded-xl bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </label>
              <label class="text-sm font-bold text-brand-navy">
                性別
                <select
                  v-model="form.gender"
                  class="mt-2 h-11 w-full rounded-xl bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">請選擇</option>
                  <option value="male">公</option>
                  <option value="female">母</option>
                </select>
              </label>
              <label class="text-sm font-bold text-brand-navy">
                生日
                <input
                  v-model="form.birthday"
                  type="date"
                  class="mt-2 h-11 w-full rounded-xl bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </label>
              <label class="text-sm font-bold text-brand-navy">
                體重
                <input
                  v-model="form.weight"
                  type="number"
                  min="0"
                  step="0.01"
                  class="mt-2 h-11 w-full rounded-xl bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </label>
              <label class="text-sm font-bold text-brand-navy">
                晶片號碼
                <input
                  v-model="form.microchipNumber"
                  type="text"
                  class="mt-2 h-11 w-full rounded-xl bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </label>
              <label class="text-sm font-bold text-brand-navy">
                血型
                <input
                  v-model="form.bloodType"
                  type="text"
                  class="mt-2 h-11 w-full rounded-xl bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </label>
              <label class="text-sm font-bold text-brand-navy">
                毛色
                <input
                  v-model="form.furColor"
                  type="text"
                  class="mt-2 h-11 w-full rounded-xl bg-[#F3F4F8] px-4 text-[14px] font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </label>
              <label class="flex items-center gap-3 pt-7 text-sm font-bold text-brand-navy">
                <input v-model="form.neutered" type="checkbox" class="h-4 w-4 accent-brand-blue" />
                已結紮
              </label>
              <label class="text-sm font-bold text-brand-navy md:col-span-2">
                備註
                <textarea
                  v-model="form.note"
                  rows="3"
                  class="mt-2 w-full resize-none rounded-xl bg-[#F3F4F8] px-4 py-3 text-[14px] font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-blue"
                ></textarea>
              </label>
              <p v-if="errorMessage" class="text-sm font-semibold text-red-600 md:col-span-2">
                {{ errorMessage }}
              </p>
            </div>
          </div>
        </form>

        <div class="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <template v-if="isEditing">
            <BaseButton variant="secondary" type="button" :disabled="isSaving" @click="cancelEditing">
              取消
            </BaseButton>
            <BaseButton type="button" :disabled="isSaving" @click="handleSubmit">
              {{ isSaving ? '儲存中...' : '儲存' }}
            </BaseButton>
          </template>
          <template v-else>
            <BaseButton variant="secondary" type="button" @click="handleClose">關閉</BaseButton>
            <BaseButton type="button" @click="startEditing">編輯</BaseButton>
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
