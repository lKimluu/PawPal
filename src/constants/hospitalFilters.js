// 醫院搜尋篩選選項的單一來源，避免表單與其他元件重複維護 label/value
export const HOSPITAL_ANIMAL_TYPES = [
  { label: '全部', value: '' },
  { label: '狗', value: 'dog' },
  { label: '貓', value: 'cat' },
  { label: '兔', value: 'rabbit' },
  { label: '鳥類', value: 'bird' },
  { label: '爬蟲類', value: 'reptile' },
  { label: '特殊寵物', value: 'exotic' },
]

export const HOSPITAL_SORT_OPTIONS = [
  { label: '相關度', value: 'relevance' },
  { label: '距離', value: 'distance', requiresLocation: true },
  { label: '名稱', value: 'name' },
]
