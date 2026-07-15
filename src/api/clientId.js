export const CLIENT_ID_HEADER = 'X-PawPal-Client-ID'
export const CLIENT_ID_STORAGE_KEY = 'pawpal_client_id'

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidClientId(value) {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value)
}

export function getOrCreateClientId(options = {}) {
  try {
    const storage = options.storage ?? globalThis.localStorage
    const cryptoProvider = options.cryptoProvider ?? globalThis.crypto
    const storedClientId = storage?.getItem(CLIENT_ID_STORAGE_KEY)

    if (isValidClientId(storedClientId)) {
      return storedClientId.toLowerCase()
    }

    if (typeof cryptoProvider?.randomUUID !== 'function') {
      return ''
    }

    const clientId = cryptoProvider.randomUUID()

    if (!isValidClientId(clientId)) {
      return ''
    }

    const normalizedClientId = clientId.toLowerCase()
    storage?.setItem(CLIENT_ID_STORAGE_KEY, normalizedClientId)

    return normalizedClientId
  } catch {
    return ''
  }
}

export function getClientIdHeaders(options) {
  const clientId = getOrCreateClientId(options)

  return clientId ? { [CLIENT_ID_HEADER]: clientId } : {}
}
