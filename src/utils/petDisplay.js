const GENDER_LABELS = {
  male: '公',
  female: '母',
}

function padDatePart(value) {
  return String(value).padStart(2, '0')
}

export function formatPetBirthday(value) {
  if (!value) return '-'

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
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

  if (!year || !month || !day) {
    return value
  }

  return `${year}-${padDatePart(month)}-${padDatePart(day)}`
}

export function formatPetGender(value) {
  if (!value) return '-'

  return GENDER_LABELS[value] ?? value
}
