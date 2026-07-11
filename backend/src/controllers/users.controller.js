import { findUserById, updateCurrentUser as updateCurrentUserService } from '../services/users.service.js'

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

export const getCurrentUser = createGetCurrentUser({ findUserById })

export function createUpdateCurrentUser({ updateCurrentUser }) {
  return async function updateCurrentUserController(req, res) {
    try {
      const user = await updateCurrentUser(req.userId, req.body)

      if (!user) {
        return res.status(404).json({ message: '找不到會員資料' })
      }

      return res.status(200).json({ user })
    } catch (error) {
      console.error(error)

      return res.status(500).json({ message: '會員資料更新失敗，請稍後再試' })
    }
  }
}

export const updateCurrentUser = createUpdateCurrentUser({
  updateCurrentUser: updateCurrentUserService,
})
