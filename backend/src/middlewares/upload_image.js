import multer from 'multer'

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])
export const MAX_AVATAR_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024
export const MAX_MEDICAL_IMAGE_FILE_SIZE_BYTES = 15 * 1024 * 1024
export const PET_AVATAR_UPLOAD_INTENT_FIELD = '__avatar_upload'
export const USER_AVATAR_UPLOAD_INTENT_FIELD = '__avatar_upload'
export const MEDICAL_IMAGE_UPLOAD_INTENT_FIELD = '__image_upload'

function isMultipartRequest(req) {
  const contentType = req.headers?.['content-type'] || ''
  return req.is?.('multipart/form-data') || contentType.includes('multipart/form-data')
}

function createBadRequestError(message) {
  const error = new Error(message)
  error.status = 400
  return error
}

export function imageFileFilter(req, file, callback) {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    callback(createBadRequestError('僅支援 JPG、PNG、WebP、HEIC 或 HEIF 圖片'))
    return
  }

  callback(null, true)
}

function formatFileSizeLimit(fileSizeLimitBytes) {
  return `${fileSizeLimitBytes / 1024 / 1024}MB`
}

export function formatUploadError(
  error,
  fileSizeLimitBytes = MAX_AVATAR_IMAGE_FILE_SIZE_BYTES,
) {
  if (!error) return null

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return createBadRequestError(
        `圖片檔案大小不可超過 ${formatFileSizeLimit(fileSizeLimitBytes)}`,
      )
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return createBadRequestError('圖片欄位或數量不符合限制')
    }
  }

  if (error.status === 400) {
    return error
  }

  return error
}

export function createImageUploadMiddleware(
  fieldName,
  maxCount,
  fileSizeLimitBytes = MAX_AVATAR_IMAGE_FILE_SIZE_BYTES,
) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: fileSizeLimitBytes,
    },
    fileFilter: imageFileFilter,
  }).array(fieldName, maxCount)

  return (req, res, next) => {
    upload(req, res, (error) => {
      const formattedError = formatUploadError(error, fileSizeLimitBytes)
      if (formattedError) {
        return res.status(formattedError.status || 500).json({
          message: formattedError.status === 400 ? formattedError.message : '圖片上傳失敗，請稍後再試',
        })
      }

      return next()
    })
  }
}

export function normalizeMultipartBody(
  req,
  { numberFields = [], booleanFields = [], arrayFields = [] } = {},
) {
  if (!isMultipartRequest(req) || !req.body) {
    return req.body
  }

  for (const field of numberFields) {
    if (req.body[field] !== undefined && typeof req.body[field] === 'string' && req.body[field].trim()) {
      req.body[field] = Number(req.body[field])
    }
  }

  for (const field of booleanFields) {
    if (req.body[field] === 'true') {
      req.body[field] = true
    } else if (req.body[field] === 'false') {
      req.body[field] = false
    }
  }

  for (const field of arrayFields) {
    const value = req.body[field]
    if (typeof value === 'string') {
      req.body[field] = value.trim() ? [value] : []
    }
  }

  return req.body
}

export function normalizePetMultipartBody(req, res, next) {
  normalizeMultipartBody(req, {
    numberFields: ['weight'],
    booleanFields: ['neutered'],
  })
  if ((req.files ?? []).length > 0) {
    req.body[PET_AVATAR_UPLOAD_INTENT_FIELD] = true
  }
  return next()
}

export function normalizeUserMultipartBody(req, res, next) {
  normalizeMultipartBody(req)
  if ((req.files ?? []).length > 0) {
    req.body[USER_AVATAR_UPLOAD_INTENT_FIELD] = true
  }
  return next()
}

export function normalizeMedicalRecordMultipartBody(req, res, next) {
  normalizeMultipartBody(req, {
    numberFields: ['pet_id'],
    arrayFields: ['image_url'],
  })
  if ((req.files ?? []).length > 0) {
    req.body[MEDICAL_IMAGE_UPLOAD_INTENT_FIELD] = true
  }
  return next()
}

export const uploadPetAvatar = createImageUploadMiddleware(
  'avatar',
  1,
  MAX_AVATAR_IMAGE_FILE_SIZE_BYTES,
)
export const uploadUserAvatar = createImageUploadMiddleware(
  'avatar',
  1,
  MAX_AVATAR_IMAGE_FILE_SIZE_BYTES,
)
export const uploadMedicalRecordImages = createImageUploadMiddleware(
  'images',
  5,
  MAX_MEDICAL_IMAGE_FILE_SIZE_BYTES,
)
