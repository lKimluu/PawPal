import * as defaultAiAssistantService from '../services/ai_assistant.service.js'
import { AiAssistantQuotaExceededError } from '../services/ai_assistant.service.js'

export function createAiAssistantController(aiAssistantService) {
  async function askAiAssistant(req, res) {
    try {
      const { message } = req.body
      const result = await aiAssistantService.getAiAssistantReply(message)

      return res.status(200).json(result)
    } catch (error) {
      if (error instanceof AiAssistantQuotaExceededError) {
        return res.status(503).json({ message: error.message })
      }

      console.error(error)

      return res.status(500).json({ message: 'AI 小助手回覆失敗，請稍後再試' })
    }
  }

  return {
    askAiAssistant,
  }
}

export const { askAiAssistant } = createAiAssistantController(defaultAiAssistantService)
