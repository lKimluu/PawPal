import * as defaultHospitalReviewService from '../services/hospital_reviews.service.js'
import {
  DuplicateHospitalReviewError,
  HospitalNotFoundError,
  HospitalReviewNotFoundError,
} from '../services/hospital_reviews.service.js'

export function createHospitalReviewsController(hospitalReviewService) {
  async function listHospitalReviews(req, res) {
    try {
      const reviews = await hospitalReviewService.listHospitalReviews(
        req.params.hospital_id,
        req.validated_query,
      )

      return res.status(200).json({ reviews })
    } catch (error) {
      console.error(error)

      return res.status(500).json({ message: '取得醫院評論失敗，請稍後再試' })
    }
  }

  async function createHospitalReview(req, res) {
    try {
      const review = await hospitalReviewService.createHospitalReview(
        req.params.hospital_id,
        req.userId,
        req.body,
      )

      return res.status(201).json({ review })
    } catch (error) {
      if (error instanceof DuplicateHospitalReviewError) {
        return res.status(409).json({ message: '你已經評論過這間醫院' })
      }

      if (error instanceof HospitalNotFoundError) {
        return res.status(404).json({ message: '找不到醫院' })
      }

      console.error(error)
      return res.status(500).json({ message: '建立醫院評論失敗，請稍後再試' })
    }
  }

  async function updateMyHospitalReview(req, res) {
    try {
      const review = await hospitalReviewService.updateMyHospitalReview(
        req.params.hospital_id,
        req.userId,
        req.body,
      )

      return res.status(200).json({ review })
    } catch (error) {
      if (error instanceof HospitalReviewNotFoundError) {
        return res.status(404).json({ message: '找不到你的醫院評論' })
      }

      console.error(error)
      return res.status(500).json({ message: '更新醫院評論失敗，請稍後再試' })
    }
  }

  async function deleteMyHospitalReview(req, res) {
    try {
      await hospitalReviewService.deleteMyHospitalReview(req.params.hospital_id, req.userId)

      return res.status(204).send()
    } catch (error) {
      if (error instanceof HospitalReviewNotFoundError) {
        return res.status(404).json({ message: '找不到你的醫院評論' })
      }

      console.error(error)
      return res.status(500).json({ message: '刪除醫院評論失敗，請稍後再試' })
    }
  }

  return {
    listHospitalReviews,
    createHospitalReview,
    updateMyHospitalReview,
    deleteMyHospitalReview,
  }
}

export const {
  listHospitalReviews,
  createHospitalReview,
  updateMyHospitalReview,
  deleteMyHospitalReview,
} =
  createHospitalReviewsController(defaultHospitalReviewService)
