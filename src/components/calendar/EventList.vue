<script setup>
import { ref, computed } from 'vue'
import EventCard from './EventCard.vue'

const props = defineProps({
  events: {
    type: Array,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['edit', 'delete', 'add', 'resync'])

const defaultCount = 4
const showAll = ref(false)

const visibleEvents = computed(() => {
  if (props.compact) return props.events
  return showAll.value ? props.events : props.events.slice(0, defaultCount)
})
</script>

<template>
  <div
    :class="
      compact
        ? 'w-full'
        : 'w-full max-w-[1024px] mx-auto px-4 mt-6 mb-4 md:mb-6 md:bg-white md:rounded-3xl md:shadow-md md:p-6'
    "
  >
    <div
      :class="
        compact
          ? 'flex items-center justify-between mb-4'
          : 'flex items-center justify-between mt-6 mb-4 md:mb-6'
      "
    >
      <div class="flex items-center gap-2">
        <div
          class="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-purple-100"
        >
          <img src="@/assets/icons/calendar.svg" alt="" class="w-5 h-5" />
        </div>
        <span class="text-base md:text-lg font-semibold text-gray-800">行程列表</span>
        <span class="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {{ events.length }} 項行程
        </span>
      </div>
      <button
        @click="$emit('add')"
        class="hover:text-[#FFA002] flex items-center gap-1 text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-1.5 md:px-4 md:py-2 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <img src="@/assets/icons/plus.svg" alt="" class="w-3 h-3" />
        新增行程
      </button>
    </div>

    <div v-if="!events || events.length === 0" class="text-center py-12 text-gray-400 text-sm">
      目前沒有行程，點擊上方「+ 新增行程」來新增。
    </div>

    <template v-else>
      <!-- compact：固定高度，超過 4 筆捲動；非 compact：無高度限制 -->
      <div :class="compact ? 'overflow-y-auto max-h-[620px] pr-1' : ''">
        <EventCard
          v-for="event in visibleEvents"
          :key="event.id"
          :event="event"
          :compact="compact"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @resync="$emit('resync', $event)"
        />
      </div>
    </template>

    <!-- 「查看完整行程」只在非 compact 模式顯示 -->
    <button
      v-if="!compact && events.length > defaultCount"
      @click="showAll = !showAll"
      class="hover:text-[#FFA002] flex items-center justify-center gap-1 w-full mt-2 py-3 text-sm text-gray-400 transition-colors cursor-pointer"
    >
      {{ showAll ? '收起' : '查看完整行程' }}
      <img
        src="@/assets/icons/angle-down.svg"
        alt=""
        class="w-4 h-4 transition-transform duration-200"
        :class="showAll ? 'rotate-180' : ''"
      />
    </button>
  </div>
</template>
