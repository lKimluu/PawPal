import vetIcon from '@/assets/icons/checkup-icon.svg'
import vaccineIcon from '@/assets/icons/vaccine-icon.svg'
import medicationIcon from '@/assets/icons/medicine-icon.svg'
import groomingIcon from '@/assets/icons/grooming-icon.svg'
import otherIcon from '@/assets/icons/other.svg'
import showerIcon from '@/assets/icons/shower.svg'
import trainingIcon from '@/assets/icons/training.svg'

// 行事曆行程類型的單一來源：key 為後端 enum，集中管理中文 label / 顏色 / icon / chip 樣式
export const EVENT_TYPE_META = {
  vet: {
    label: '看診',
    color: '#EF7C7C',
    bg: 'bg-red-100',
    chip: 'bg-red-100 text-red-500',
    icon: vetIcon,
  },
  vaccine: {
    label: '疫苗',
    color: '#4CC9A4',
    bg: 'bg-emerald-100',
    chip: 'bg-emerald-100 text-emerald-600',
    icon: vaccineIcon,
  },
  grooming: {
    label: '美容',
    color: '#A78BFA',
    bg: 'bg-purple-100',
    chip: 'bg-purple-100 text-purple-600',
    icon: groomingIcon,
  },
  medication: {
    label: '餵藥',
    color: '#FFA94D',
    bg: 'bg-yellow-50',
    chip: 'bg-yellow-50 text-yellow-500',
    icon: medicationIcon,
  },
  bath: {
    label: '洗澡',
    color: '#60A5FA',
    bg: 'bg-blue-50',
    chip: 'bg-blue-50 text-blue-500',
    icon: showerIcon,
  },
  training: {
    label: '訓練',
    color: '#F472B6',
    bg: 'bg-pink-50',
    chip: 'bg-pink-50 text-pink-500',
    icon: trainingIcon,
  },
  other: {
    label: '其他',
    color: '#9CA3AF',
    bg: 'bg-gray-100',
    chip: 'bg-gray-100 text-gray-500',
    icon: otherIcon,
  },
}

// 查表 helper，未知 type 一律 fallback 到 other
export function getTypeMeta(type) {
  return EVENT_TYPE_META[type] ?? EVENT_TYPE_META.other
}

// 給 modal type chips 用的選項陣列
export const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_META).map(([value, meta]) => ({
  value,
  label: meta.label,
  color: meta.color,
}))
