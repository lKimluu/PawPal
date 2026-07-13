<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'

const props = defineProps({
  centerXPct: Number,
  centerYPct: Number,
  widthPct: Number,
  heightPct: Number,
  blinking: Boolean,
  rotate: Number,
})

const eyeRef = ref(null)
const pupil = ref({ x: 0, y: 0 })
const pupilSize = ref(24)

let cachedRect = null

let observer = null

const measure = () => {
  if (!eyeRef.value) return

  cachedRect = eyeRef.value.getBoundingClientRect()

  const currentHeight = cachedRect.height
  if (currentHeight <= 10) {
    pupilSize.value = 24
  }
  pupilSize.value = currentHeight * 0.65
}

const onMove = (e) => {
  if (!eyeRef.value) return
  if (!cachedRect) return

  let clientX, clientY
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX
    clientY = e.changedTouches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }

  const cx = cachedRect.left + cachedRect.width / 2
  const cy = cachedRect.top + cachedRect.height / 2

  const dx = clientX - cx
  const dy = clientY - cy
  const distance = Math.sqrt(dx * dx + dy * dy)

  const inset = cachedRect.height * 0.1
  const maxX = cachedRect.width / 2 - pupilSize.value / 2 - inset
  const maxY = cachedRect.height / 2 - pupilSize.value / 2 - inset

  if (distance < 0.5) {
    pupil.value = { x: 0, y: 0 }
    return
  }
  const nx = dx / distance
  const ny = dy / distance
  const ellipseR = 1 / Math.sqrt((nx / maxX) ** 2 + (ny / maxY) ** 2)
  const mag = Math.min(distance, ellipseR)
  pupil.value = { x: nx * mag, y: ny * mag }
}

onMounted(() => {
  measure()

  if (eyeRef.value) {
    observer = new ResizeObserver(() => {
      measure()
    })
    observer.observe(eyeRef.value)
  }

  window.addEventListener('mousemove', onMove)

  window.addEventListener('touchstart', onMove, { passive: true })
  window.addEventListener('touchmove', onMove, { passive: true })
})

onUnmounted(() => {
  if (observer && eyeRef.value) {
    observer.unobserve(eyeRef.value)
    observer.disconnect()
  }

  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('touchstart', onMove)
  window.removeEventListener('touchmove', onMove)
})

const eyeStyle = computed(() => ({
  left: `${props.centerXPct}%`,
  top: `${props.centerYPct}%`,
  width: `${props.widthPct}%`,
  aspectRatio: `${props.widthPct} / ${props.heightPct}`,
  transform: 'translate(-50%, -50%)',
}))

const pupilStyle = computed(() => ({
  top: '50%',
  left: '50%',
  width: `${pupilSize.value}px`,
  height: `${pupilSize.value}px`,
  transform: `translate(-50%, -50%) translate(${pupil.value.x}px, ${pupil.value.y}px)`,
  transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1)',
}))

const lidStyle = computed(() => ({
  backgroundColor: '#ffa002',
  width: '140%',
  height: '100%',
  left: '-20%',
  transform: props.blinking
    ? `translateY(0%) rotate(${props.rotate || 0}deg)`
    : `translateY(-110%) rotate(${props.rotate || 0}deg)`,
  transition: `transform ${props.blinking ? 90 : 130}ms ease-in-out`,
}))

defineExpose({ measure })
</script>

<template>
  <div ref="eyeRef" class="absolute rounded-[50%] overflow-hidden" :style="eyeStyle">
    <div class="absolute rounded-full bg-[#2b2b2b]" :style="pupilStyle"></div>
    <div class="absolute inset-0 origin-top rounded-[50%]" :style="lidStyle"></div>
  </div>
</template>
