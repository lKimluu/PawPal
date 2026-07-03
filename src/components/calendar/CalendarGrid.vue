<script setup>
import { ref, computed } from 'vue'
const emit = defineEmits(['open-add-modal'])
import { calendarEvents } from '@/data/calendarEvents.js'
import CalendarEventItem from './CalendarEventItem.vue'

const activePet = ref('xiaobai')

const petTabs = [
  { id: 'all', label: '檢視全部' },
  { id: 'xiaobai', label: '阿肥' },
  { id: 'juzi', label: '學妹' },
]

const weekdays = [
  { key: 'sun', label: '日' },
  { key: 'mon', label: '一' },
  { key: 'tue', label: '二' },
  { key: 'wed', label: '三' },
  { key: 'thu', label: '四' },
  { key: 'fri', label: '五' },
  { key: 'sat', label: '六' },
]

const chineseMonths = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
]

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const selectedIndex = ref(null)

const monthTitle = computed(() => `${currentYear.value}年 ${chineseMonths[currentMonth.value]}`)

const calendarCells = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells = []

  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  for (let i = firstDay - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i
    const d = new Date(year, month - 1, date)
    cells.push({
      date,
      fullDate: fmt(d),
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      hasEvent: false,
      isSunday: d.getDay() === 0,
      isSaturday: d.getDay() === 6,
    })
  }

  for (let date = 1; date <= daysInMonth; date++) {
    const d = new Date(year, month, date)
    const isToday =
      year === today.getFullYear() && month === today.getMonth() && date === today.getDate()
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(date).padStart(2, '0')
    const dateStr = `${year}-${mm}-${dd}`
    cells.push({
      date,
      fullDate: fmt(d),
      isCurrentMonth: true,
      isToday,
      isSelected: false,
      hasEvent: false,
      isSunday: d.getDay() === 0,
      isSaturday: d.getDay() === 6,
      events: calendarEvents.filter((e) => e.date === dateStr),
    })
  }

  for (let date = 1; cells.length % 7 !== 0; date++) {
    const d = new Date(year, month + 1, date)
    cells.push({
      date,
      fullDate: fmt(d),
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      hasEvent: false,
      isSunday: d.getDay() === 0,
      isSaturday: d.getDay() === 6,
    })
  }

  return cells
})

function prevMonth() {
  selectedIndex.value = null
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else currentMonth.value--
}

function nextMonth() {
  selectedIndex.value = null
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else currentMonth.value++
}

function goToToday() {
  selectedIndex.value = null
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth()
}

function selectCell(index) {
  selectedIndex.value = index
}
</script>
<template>
  <!-- 外層容器 -->
  <div
    class="overflow-hidden rounded-3xl border border-brand-lightblue bg-brand-white shadow-[0_8px_28px_rgba(61,74,122,0.08)] p-3 md:p-4 lg:p-6"
  >
    <!-- 寵物篩選按鈕 -->
    <div class="flex flex-wrap gap-2 mb-5">
      <button
        v-for="tab in petTabs"
        :key="tab.id"
        @click="activePet = tab.id"
        class="px-2 py-1 text-xs rounded-full border-2 font-medium whitespace-nowrap cursor-pointer transition-all duration-200 md:px-4 md:py-2 md:text-sm lg:px-[18px] lg:py-2 lg:text-sm"
        :class="
          tab.id === activePet
            ? 'border-brand-blue bg-brand-blue text-brand-white font-semibold'
            : 'border-brand-lightblue bg-white text-brand-gray hover:border-brand-blue hover:text-brand-darkgray'
        "
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 月份導覽列 -->
    <div class="flex items-center justify-between gap-3 mb-5">
      <!-- 上個月 -->
      <button
        aria-label="上個月"
        class="w-[34px] h-[34px] shrink-0 rounded-full border-2 border-brand-lightblue bg-white text-brand-gray flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-brand-blue hover:text-brand-blue hover:bg-brand-lightblue"
        @click="prevMonth"
      >
        <img src="@/assets/icons/chevron-left.svg" class="w-4 h-4" />
      </button>

      <!-- 月份標題 -->

      <h2
        class="flex-1 text-center text-base md:text-lg lg:text-[22px] font-medium text-brand-navy tracking-wide m-0"
      >
        {{ monthTitle }}
      </h2>

      <!-- 右側：下個月 + 今天 -->
      <div class="flex items-center gap-2">
        <button
          aria-label="下個月"
          class="w-[34px] h-[34px] shrink-0 rounded-full border-2 border-brand-lightblue bg-white text-brand-gray flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-brand-blue hover:text-brand-blue hover:bg-brand-lightblue"
          @click="nextMonth"
        >
          <img src="@/assets/icons/chevron-right.svg" class="w-4 h-4" />
        </button>
        <button
          class="px-3 py-[6px] rounded-full border-2 border-brand-orange bg-transparent text-brand-orange text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 hover:bg-brand-orange hover:text-brand-white md:text-sm"
          @click="goToToday"
        >
          今天
        </button>
      </div>
    </div>

    <!-- 行事曆主體 -->
    <div class="bg-white rounded-xl border border-brand-lightblue overflow-hidden">
      <!-- 星期列 -->
      <div class="grid grid-cols-7 border-b border-brand-lightblue">
        <div
          v-for="day in weekdays"
          :key="day.key"
          class="text-xs py-1 text-center md:py-2 md:text-sm lg:text-base"
          :class="{
            'text-brand-orange': day.key === 'sun',
            'text-brand-blue': day.key === 'sat',
            'text-brand-gray': day.key !== 'sun' && day.key !== 'sat',
          }"
        >
          {{ day.label }}
        </div>
      </div>

      <!-- 日期格 grid -->
      <div class="grid grid-cols-7">
        <div
          v-for="(cell, index) in calendarCells"
          :key="index"
          @click="selectCell(index)"
          class="date-cell group relative min-h-15 border-r border-b border-brand-lightblue outline-brand-blue transition-colors duration-150 hover:bg-[#F4F5FA] overflow-hidden md:min-h-[70px] lg:min-h-[100px]"
          :class="{
            'bg-brand-lightblue outline outline-1 -outline-offset-1  md:outline-2 md:-outline-offset-2':
              index === selectedIndex,
          }"
        >
          <div class="p-1 flex flex-col h-full relative overflow-hidden md:p-1.5 lg:p-2">
            <!-- 日期數字 -->
            <div class="flex items-start justify-between">
              <span
                class="w-4 h-4 flex items-center justify-center rounded-full shrink-0 leading-none text-xs md:w-5 md:h-5 md:text-sm lg:w-[30px] lg:h-[30px] lg:text-base"
                :class="[
                  cell.isToday
                    ? 'bg-brand-blue text-white font-normal'
                    : !cell.isCurrentMonth
                      ? 'text-[#B0B0C0]'
                      : cell.isSunday
                        ? 'text-brand-orange'
                        : cell.isSaturday
                          ? 'text-brand-blue'
                          : 'text-[#2D2D3A]',
                ]"
              >
                {{ cell.date }}
              </span>
              <span
                v-if="cell.events?.length > 3"
                class="hidden md:inline rounded-full bg-brand-blue text-white px-1.5 py-0.5 text-[10px] lg:text-xs leading-none mt-1"
              >
                more...
              </span>
            </div>

            <!-- 行事曆事件 -->
            <CalendarEventItem v-if="cell.events?.length" :events="cell.events" />

            <!-- 新增代辦按鈕（hover顯示，手機隱藏） -->
            <button
              aria-label="新增代辦"
              @click.stop="emit('open-add-modal', cell.fullDate)"
              class="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-blue text-white hidden lg:flex items-center justify-center cursor-pointer opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-110 hover:bg-brand-navy p-1"
            >
              <img src="@/assets/icons/new-item.svg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-cell:nth-child(7n) {
  border-right: none;
}
.date-cell:nth-last-child(-n + 7) {
  border-bottom: none;
}
</style>
