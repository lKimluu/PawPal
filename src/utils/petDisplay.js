const GENDER_LABELS = {
  male: '公',
  female: '母',
}

function padDatePart(value) {
  return String(value).padStart(2, '0')
}

function getTaipeiDateParts(value) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
  }
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

export function formatPetAge(birthday, referenceDate = new Date()) {
  const formattedBirthday = formatPetBirthday(birthday)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedBirthday)) {
    return '-'
  }

  const [birthYear, birthMonth, birthDay] = formattedBirthday.split('-').map(Number)
  const today = getTaipeiDateParts(referenceDate)

  if (!today.year || !today.month || !today.day) {
    return '-'
  }

  let months = (today.year - birthYear) * 12 + (today.month - birthMonth)

  if (today.day < birthDay) {
    months -= 1
  }

  if (months < 0) {
    return '-'
  }

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years > 0 && remainingMonths > 0) {
    return `${years}歲${remainingMonths}個月`
  }

  if (years > 0) {
    return `${years}歲`
  }

  if (remainingMonths > 0) {
    return `${remainingMonths}個月`
  }

  return '未滿1個月'
}

export function formatPetGender(value) {
  if (!value) return '-'

  return GENDER_LABELS[value] ?? value
}
