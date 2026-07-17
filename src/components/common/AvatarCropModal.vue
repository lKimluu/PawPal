<script setup>
import { computed, ref, watch } from 'vue'
import { CircleStencil, Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const OUTPUT_SIZE = 512
const OUTPUT_MIME_TYPE = 'image/webp'
const OUTPUT_QUALITY = 0.9
const MAX_STENCIL_SIZE = 280
const STENCIL_BOUNDARY_RATIO = 0.8
const ZOOM_SLIDER_MAX = 100
const MAX_RELATIVE_ZOOM_SCALE = 5
const ZOOM_SENSITIVITY = Math.log(MAX_RELATIVE_ZOOM_SCALE) / ZOOM_SLIDER_MAX

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  imageUrl: { type: String, default: '' },
  fileName: { type: String, default: 'avatar.webp' },
  title: { type: String, default: '裁切會員頭像' },
  subtitle: { type: String, default: '拖曳圖片並調整縮放，確認最後的圓形顯示範圍' },
})

const emit = defineEmits(['confirm', 'cancel'])

const cropperRef = ref(null)
const zoomValue = ref(0)
const cropError = ref('')
const isProcessing = ref(false)
const cropperCanvas = { width: 512, height: 512 }
const resizeImageSettings = {
  adjustStencil: false,
  wheel: false,
  touch: false,
}
const zoomOptions = {
  transitions: false,
}
const stencilProps = {
  aspectRatio: 1,
  movable: false,
  resizable: false,
  lines: {},
  handlers: {},
}

const canConfirm = computed(() => props.imageUrl && !isProcessing.value && !cropError.value)

function resetCropState() {
  zoomValue.value = 0
  cropError.value = ''
  isProcessing.value = false
}

function handleCancel() {
  emit('cancel')
}

function handleReady() {
  cropError.value = ''
}

function handleCropperError() {
  cropError.value = isLikelyHeicFile(props.fileName)
    ? '此瀏覽器無法預覽 HEIC/HEIF 圖片，請改用 JPG、PNG 或 WebP 後再上傳'
    : '原始圖片讀取失敗，請重新選擇圖片'
}

function handleZoomInput(event) {
  const nextZoomValue = Number(event.target.value)

  if (!Number.isFinite(nextZoomValue) || nextZoomValue < 0) return

  const zoomFactor = getZoomFactor(zoomValue.value, nextZoomValue)

  if (zoomFactor !== 1) {
    cropperRef.value?.zoom(zoomFactor, undefined, zoomOptions)
  }

  zoomValue.value = nextZoomValue
}

function getZoomFactor(previousZoomValue, nextZoomValue) {
  return Math.exp((nextZoomValue - previousZoomValue) * ZOOM_SENSITIVITY)
}

function isLikelyHeicFile(fileName) {
  return /\.(heic|heif)$/i.test(fileName.trim())
}

function getFixedStencilSize({ boundaries }) {
  const availableSize = Math.min(boundaries.width, boundaries.height) * STENCIL_BOUNDARY_RATIO
  const size = Math.min(MAX_STENCIL_SIZE, availableSize)

  return {
    width: size,
    height: size,
  }
}

async function handleConfirm() {
  if (!canConfirm.value) return

  cropError.value = ''
  isProcessing.value = true

  try {
    const result = cropperRef.value?.getResult()
    const canvas = result?.canvas

    if (!canvas) {
      throw new Error('missing-crop-canvas')
    }

    const blob = await canvasToBlob(canvas)
    const croppedFile = new File([blob], buildCroppedFileName(props.fileName), {
      type: blob.type || OUTPUT_MIME_TYPE,
      lastModified: Date.now(),
    })

    emit('confirm', croppedFile)
  } catch {
    cropError.value = '裁切結果產生失敗，請重新調整後再試一次'
  } finally {
    isProcessing.value = false
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('canvas-to-blob-failed'))
        return
      }

      resolve(blob)
    }, OUTPUT_MIME_TYPE, OUTPUT_QUALITY)
  })
}

function buildCroppedFileName(fileName) {
  const safeName = fileName.trim() || 'avatar'
  const baseName = safeName.replace(/\.[^/.]+$/, '')

  return `${baseName}-cropped.webp`
}

watch(
  () => [props.isOpen, props.imageUrl],
  () => {
    resetCropState()
  },
)
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="title"
    :subtitle="subtitle"
    title-content-class="items-start text-left"
    @close="handleCancel"
  >
    <section class="flex min-h-0 flex-col gap-5 pr-4 md:pr-6">
      <div
        class="relative h-[320px] overflow-hidden rounded-2xl bg-slate-100 sm:h-[360px]"
      >
        <Cropper
          v-if="imageUrl"
          ref="cropperRef"
          class="h-full w-full bg-slate-100"
          image-restriction="stencil"
          :src="imageUrl"
          :stencil-component="CircleStencil"
          :stencil-props="stencilProps"
          :stencil-size="getFixedStencilSize"
          :resize-image="resizeImageSettings"
          default-boundaries="fit"
          :canvas="cropperCanvas"
          :auto-zoom="false"
          @ready="handleReady"
          @error="handleCropperError"
        />
      </div>

      <label class="flex flex-col gap-2 text-sm font-bold text-brand-navy">
        縮放圖片
        <input
          type="range"
          min="0"
          :max="ZOOM_SLIDER_MAX"
          step="1"
          :value="zoomValue"
          class="h-2 w-full cursor-pointer accent-brand-orange"
          aria-label="縮放圖片"
          @input="handleZoomInput"
        />
      </label>

      <p
        v-if="cropError"
        class="text-sm font-semibold text-red-500"
        role="alert"
      >
        {{ cropError }}
      </p>

      <div class="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <BaseButton variant="orange" class="min-w-[96px]" @click="handleCancel">
          取消
        </BaseButton>
        <BaseButton class="min-w-[96px]" :disabled="!canConfirm" @click="handleConfirm">
          {{ isProcessing ? '處理中...' : '確認' }}
        </BaseButton>
      </div>
    </section>
  </BaseModal>
</template>
