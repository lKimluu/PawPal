<script setup>
import { computed } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { formatLocalMonthDay } from '@/utils/dateFormat.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const props = defineProps({
  records: { type: Array, default: () => [] },
  range: { type: String, default: '6 個月' },
})

const RANGE_DAYS = { '3 個月': 90, '6 個月': 180, '1 年': 365 }

const METRIC_META = {
  weight: { label: '體重趨勢', unit: 'kg', type: 'line', color: '#ffa002', decimals: 1 },
  length: { label: '身體長度', unit: 'cm', type: 'line', color: '#64748b', decimals: 1 },
  food_intake: { label: '每日進食量', unit: 'g', type: 'bar', color: '#10B981', decimals: 1 },
  water_frequency: { label: '飲水次數', unit: '次', type: 'bar', color: '#92a8f5', decimals: 0 },
  urination: { label: '排尿次數', unit: '次', type: 'bar', color: '#ff66cc', decimals: 0 },
  defecation: { label: '排便次數', unit: '次', type: 'bar', color: '#8B5CF6', decimals: 0 },
}

const displayRecords = computed(() => {
  const days = RANGE_DAYS[props.range] ?? 180
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const grouped = {}
  for (const r of props.records) {
    if (new Date(r.recorded_at) < cutoff) continue
    if (!grouped[r.metric_type]) grouped[r.metric_type] = []
    grouped[r.metric_type].push(r)
  }

  return Object.entries(grouped)
    .map(([metric_type, items]) => {
      const meta = METRIC_META[metric_type]
      if (!meta) return null

      const sorted = [...items].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
      const latest = sorted[sorted.length - 1]

      return {
        metric_type,
        metric: meta.label,
        currentValue: latest?.value != null ? Number(latest.value).toFixed(meta.decimals) : '-',
        unit: meta.unit,
        chartType: meta.type,
        themeColor: meta.color,
        history: sorted.map((r) => ({
          date: formatLocalMonthDay(r.recorded_at),
          value: Number(r.value),
        })),
      }
    })
    .filter(Boolean)
    .filter((item) => item.history.some((h) => h.value > 0))
})

const getChartData = (record) => ({
  labels: record.history.map((item) => item.date),
  datasets: [
    {
      data: record.history.map((item) => item.value),
      borderColor: record.themeColor,
      backgroundColor: `${record.themeColor}25`,
      borderWidth: 2,
      pointBackgroundColor: record.themeColor,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      fill: true,
      tension: 0.4,
      borderRadius: record.chartType === 'bar' ? 4 : 0,
    },
  ],
})

const getChartOptions = (record) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1E293B',
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94A3B8', font: { size: 12 } },
    },
    y: {
      beginAtZero: record.chartType === 'bar',
      grid: { color: '#F1F5F9', borderDash: [5, 5] },
      ticks: { color: '#94A3B8', font: { size: 12 } },
    },
  },
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full p-4">
    <div
      v-if="displayRecords.length === 0"
      class="md:col-span-2 flex items-center justify-center py-16 text-sm text-brand-gray"
    >
      目前沒有紀錄
    </div>

    <div
      v-for="record in displayRecords"
      :key="record.metric_type"
      class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col h-full"
      :class="{
        'md:col-span-2': record.metric_type === 'weight' || record.metric_type === 'length',
      }"
    >
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center gap-2">
          <span
            class="w-2.5 h-2.5 rounded-full"
            :style="{ backgroundColor: record.themeColor }"
          ></span>
          <h3 class="text-brand-navy font-bold text-base">{{ record.metric }}</h3>
        </div>
        <div class="text-right flex flex-col items-end">
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-medium tracking-wider" :style="{ color: record.themeColor }">
              {{ record.currentValue }}
            </span>
            <span class="text-brand-gray text-sm font-medium">{{ record.unit }}</span>
          </div>
        </div>
      </div>
      <div class="relative w-full h-48 mt-auto">
        <Line
          v-if="record.chartType === 'line'"
          :key="`line-${record.metric_type}-${record.history.length}`"
          :data="getChartData(record)"
          :options="getChartOptions(record)"
        />
        <Bar
          v-else
          :key="`bar-${record.metric_type}-${record.history.length}`"
          :data="getChartData(record)"
          :options="getChartOptions(record)"
        />
      </div>
    </div>
  </div>
</template>
