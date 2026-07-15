import {
  findUserById as defaultFindUserById,
  updateCurrentUser as updateCurrentUserService,
} from '../services/users.service.js'
import { uploadImages as defaultUploadImages } from '../services/image_upload.service.js'
import { USER_AVATAR_UPLOAD_INTENT_FIELD } from '../middlewares/upload_image.js'

function hasUploadedFiles(req) {
  return (req.files ?? []).length > 0
}

function stripInternalUserFields(userData) {
  const { [USER_AVATAR_UPLOAD_INTENT_FIELD]: _avatarUploadIntent, ...publicUserData } = userData
  return publicUserData
}

async function attachUploadedUserAvatar(req, uploadImages) {
  if (!hasUploadedFiles(req)) return

  const urls = await uploadImages(req.files)
  if (!urls[0]) {
    const error = new Error('圖片上傳失敗，請稍後再試')
    error.status = 502
    throw error
  }
  req.body.avatar_url = urls[0]
}

export function createGetCurrentUser({ findUserById }) {
  return async function getCurrentUser(req, res) {
    try {
      const user = await findUserById(req.userId)

      if (!user) {
        return res.status(404).json({ message: '找不到使用者' })
      }

      return res.status(200).json({ user })
    } catch (error) {
      console.error(error)

      return res.status(500).json({ message: '取得使用者資料失敗' })
    }
  }
}

export const getCurrentUser = createGetCurrentUser({ findUserById: defaultFindUserById })

export function createUpdateCurrentUser({
  findUserById = defaultFindUserById,
  updateCurrentUser,
  uploadImages = defaultUploadImages,
}) {
  return async function updateCurrentUserController(req, res) {
    try {
      if (hasUploadedFiles(req)) {
        const existingUser = await findUserById(req.userId)
        if (!existingUser) {
          return res.status(404).json({ message: '找不到會員資料' })
        }
      }

      await attachUploadedUserAvatar(req, uploadImages)
      const userData = stripInternalUserFields(req.body)
      const user = await updateCurrentUser(req.userId, userData)

      if (!user) {
        return res.status(404).json({ message: '找不到會員資料' })
      }

      return res.status(200).json({ user })
    } catch (error) {
      console.error(error)

      return res.status(error.status || 500).json({
        message: error.status ? error.message : '會員資料更新失敗，請稍後再試',
      })
    }
  }
}

export const updateCurrentUser = createUpdateCurrentUser({
  updateCurrentUser: updateCurrentUserService,
})
