import * as defaultHospitalReviewService from '../services/hospital_reviews.service.js'

function parseHospitalId(req) {
  const hospitalId = Number(req.params.hospitalId)
  return Number.isSafeInteger(hospitalId) && hospitalId > 0 ? hospitalId : null
}

function parseReviewId(req) {
  const reviewId = Number(req.params.reviewId)
  return Number.isSafeInteger(reviewId) && reviewId > 0 ? reviewId : null
}

export function createHospitalReviewsController(hospitalReviewService) {
  async function ensureHospital(hospitalId, res) {
    if (!hospitalId) {
      res.status(400).json({ message: '醫院 ID 必須是正整數' })
      return false
    }

    if (!(await hospitalReviewService.hospitalExists(hospitalId))) {
      res.status(404).json({ message: '找不到醫院資料' })
      return false
    }

    return true
  }

  async function listHospitalReviews(req, res) {
    try {
      const hospitalId = parseHospitalId(req)
      if (!(await ensureHospital(hospitalId, res))) return res

      const [summary, reviews] = await Promise.all([
        hospitalReviewService.findHospitalReviewSummary(hospitalId),
        hospitalReviewService.findHospitalReviews(hospitalId),
      ])

      return res.status(200).json({ summary, reviews })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: '讀取醫院評論失敗，請稍後再試' })
    }
  }

  async function createHospitalReview(req, res) {
    try {
      const hospitalId = parseHospitalId(req)
      if (!(await ensureHospital(hospitalId, res))) return res

      const review = await hospitalReviewService.createHospitalReview({
        hospitalId,
        userId: req.userId,
        rating: req.body.rating,
        comment: req.body.comment,
      })
      const summary = await hospitalReviewService.findHospitalReviewSummary(hospitalId)

      return res.status(201).json({
        message: '評論已送出',
        review,
        summary,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: '送出評論失敗，請稍後再試' })
    }
  }

  async function updateHospitalReview(req, res) {
    try {
      const hospitalId = parseHospitalId(req)
      if (!(await ensureHospital(hospitalId, res))) return res

      const reviewId = parseReviewId(req)
      if (!reviewId) {
        return res.status(400).json({ message: '評論 ID 格式錯誤' })
      }

      const review = await hospitalReviewService.updateHospitalReview({
        reviewId,
        hospitalId,
        userId: req.userId,
        rating: req.body.rating,
        comment: req.body.comment,
      })

      if (!review) {
        return res.status(404).json({ message: '找不到可修改的評論' })
      }

      const summary = await hospitalReviewService.findHospitalReviewSummary(hospitalId)

      return res.status(200).json({
        message: '評論已更新',
        review,
        summary,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: '更新評論失敗，請稍後再試' })
    }
  }

  async function deleteHospitalReview(req, res) {
    try {
      const hospitalId = parseHospitalId(req)
      if (!(await ensureHospital(hospitalId, res))) return res

      const reviewId = parseReviewId(req)
      if (!reviewId) {
        return res.status(400).json({ message: '評論 ID 格式錯誤' })
      }

      const deleted = await hospitalReviewService.deleteHospitalReview({
        reviewId,
        hospitalId,
        userId: req.userId,
      })

      if (!deleted) {
        return res.status(404).json({ message: '找不到可刪除的評論' })
      }

      const summary = await hospitalReviewService.findHospitalReviewSummary(hospitalId)

      return res.status(200).json({
        message: '評論已刪除',
        summary,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: '刪除評論失敗，請稍後再試' })
    }
  }

  return {
    listHospitalReviews,
    createHospitalReview,
    updateHospitalReview,
    deleteHospitalReview,
  }
}

export const { listHospitalReviews, createHospitalReview, updateHospitalReview, deleteHospitalReview } =
  createHospitalReviewsController(defaultHospitalReviewService)
