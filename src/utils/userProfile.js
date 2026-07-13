export function hasUserAvatar(user) {
  return getUserAvatarUrl(user) !== ''
}

export function getUserAvatarUrl(user) {
  const avatarUrl = user?.avatar_url

  if (typeof avatarUrl !== 'string') {
    return ''
  }

  return avatarUrl.trim()
}

export function getUserDisplayName(user) {
  const name = user?.name

  if (typeof name !== 'string' || name.trim() === '') {
    return '寵物家長'
  }

  return name.trim()
}

export function getUserDisplayEmail(user) {
  const email = user?.email

  if (typeof email !== 'string' || email.trim() === '') {
    return '尚未提供 Email'
  }

  return email.trim()
}
