import * as defaultHospitalFavoriteService from '../services/hospital_favorites.service.js'
import {
  DuplicateHospitalFavoriteError,
  HospitalFavoriteNotFoundError,
  HospitalNotFoundError,
} from '../services/hospital_favorites.service.js'

export function createHospitalFavoritesController(hospitalFavoriteService) {
  async function addHospitalFavorite(req, res) {
    try {
      const hospitalId = req.params.hospital_id
      await hospitalFavoriteService.addHospitalFavorite(hospitalId, req.userId)

      return res.status(201).json({ message: '已加入收藏' })
    } catch (error) {
      if (error instanceof DuplicateHospitalFavoriteError) {
        return res.status(409).json({ message: '此醫院已收藏' })
      }

      if (error instanceof HospitalNotFoundError) {
        return res.status(404).json({ message: '找不到這間醫院' })
      }

      console.error(error)
      return res.status(500).json({ message: '收藏醫院失敗，請稍後再試' })
    }
  }

  async function removeHospitalFavorite(req, res) {
    try {
      const hospitalId = req.params.hospital_id
      await hospitalFavoriteService.removeHospitalFavorite(hospitalId, req.userId)

      return res.status(200).json({ message: '已取消收藏' })
    } catch (error) {
      if (error instanceof HospitalFavoriteNotFoundError) {
        return res.status(404).json({ message: '此收藏不存在，請重新確認' })
      }

      console.error(error)
      return res.status(500).json({ message: '取消收藏失敗，請稍後再試' })
    }
  }

  return {
    addHospitalFavorite,
    removeHospitalFavorite,
  }
}

export const { addHospitalFavorite, removeHospitalFavorite } =
  createHospitalFavoritesController(defaultHospitalFavoriteService)
