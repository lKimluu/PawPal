import { GoogleGenAI } from '@google/genai'

const GEMINI_MODEL = 'gemini-2.0-flash'

const QUOTA_EXCEEDED_MESSAGE = 'AI 小助手目前使用量較大，請稍後再試'

const EMERGENCY_REPLY =
  '您描述的狀況可能屬於緊急情況，為了寵物的安全，請盡速帶牠就醫或聯繫獸醫協助，切勿自行判斷或延誤就醫時機。'

const SYSTEM_INSTRUCTION =
  '你是 PawPal 平台的寵物科普小助手，只回答與寵物飼養、健康、行為衛教相關的問題，' +
  '使用繁體中文回覆，內容需簡潔易懂。若問題與寵物科普無關，請婉拒並說明你只能回答寵物相關問題。'

const EMERGENCY_KEYWORDS = [
  '中毒', '誤食', '吃到巧克力', '吃到毒藥', '吃到老鼠藥',
  '抽搐', '痙攣', '癲癇', '昏迷', '意識不清', '沒有反應', '癱軟', '站不起來',
  '呼吸困難', '呼吸急促', '呼吸停止', '休克', '臉色發紫', '嘴唇發白',
  '大量出血', '流血不止', '車禍', '墜樓', '骨折', '開放性傷口',
  '腹部腫脹', '胃扭轉', '持續嘔吐', '吐血', '血便', '血尿',
  '無法排尿', '難產',
  '中暑', '熱衰竭', '溺水', '觸電', '蛇咬', '蜂螫',
  '臉部腫脹', '過敏性休克',
]

export class AiAssistantQuotaExceededError extends Error {
  constructor(message = QUOTA_EXCEEDED_MESSAGE) {
    super(message)
    this.name = 'AiAssistantQuotaExceededError'
  }
}

function containsEmergencyKeyword(message) {
  return EMERGENCY_KEYWORDS.some((keyword) => message.includes(keyword))
}

function isQuotaExceededError(error) {
  if (error?.status === 429) {
    return true
  }

  return /RESOURCE_EXHAUSTED|quota/i.test(error?.message ?? '')
}

export function getGeminiApiKey(env = process.env) {
  const apiKey = env.GEMINI_API_KEY

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is required')
  }

  return apiKey
}

function createDefaultGeminiClient(env) {
  return new GoogleGenAI({ apiKey: getGeminiApiKey(env) })
}

export async function getAiAssistantReply(
  message,
  { geminiClient, env = process.env } = {},
) {
  if (containsEmergencyKeyword(message)) {
    return { reply: EMERGENCY_REPLY }
  }

  const client = geminiClient ?? createDefaultGeminiClient(env)

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    })

    return { reply: response.text ?? '' }
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new AiAssistantQuotaExceededError()
    }

    throw error
  }
}
