import { GoogleGenAI } from '@google/genai'

const GEMINI_MODEL = 'gemini-3.1-flash-lite'

const QUOTA_EXCEEDED_MESSAGE = 'AI 小助手目前使用量較大，請稍後再試'

const EMERGENCY_REPLY =
  '您描述的狀況可能屬於緊急情況，為了寵物的安全，請盡速帶牠就醫或聯繫獸醫協助，切勿自行判斷或延誤就醫時機。'

const SYSTEM_INSTRUCTION = `
你是 PawPal 的 AI 寵物科普小助手。
你的任務是提供寵物日常照護、飲食、清潔、行為與基礎保健的科普資訊。

請遵守以下規則：
1. 一律使用繁體中文回答。
2. 語氣要自然、親切、好懂，像在和一般飼主對話。
3. 回答以 3 到 5 句為主，避免太長。
4. 直接輸出純文字，不要使用 Markdown，不要輸出 **、#、- 等符號。
5. 不要主動使用條列式，除非使用者明確要求。
6. 不要自稱獸醫師，不要做醫療診斷，不要開藥，不要取代專業醫療判斷。
7. 如果問題涉及急症、中毒、持續異常、呼吸困難、抽搐、明顯出血、無法進食、精神極差等情況，請明確建議盡快就醫。
8. 如果資訊不夠明確，請保守回答，不要猜測。
9. 回答結構盡量遵守：第一句先直接回答問題，接著補充原因或建議，若有風險再補一句就醫提醒。
10. 一般科普問題不用過度警示，只有在明顯有風險時再提醒就醫。
`

const EMERGENCY_KEYWORDS = [
  '中毒',
  '誤食',
  '吃到巧克力',
  '吃到毒藥',
  '吃到老鼠藥',
  '抽搐',
  '痙攣',
  '癲癇',
  '昏迷',
  '意識不清',
  '沒有反應',
  '癱軟',
  '站不起來',
  '呼吸困難',
  '呼吸急促',
  '呼吸停止',
  '休克',
  '臉色發紫',
  '嘴唇發白',
  '大量出血',
  '流血不止',
  '車禍',
  '墜樓',
  '骨折',
  '開放性傷口',
  '腹部腫脹',
  '胃扭轉',
  '持續嘔吐',
  '吐血',
  '血便',
  '血尿',
  '無法排尿',
  '難產',
  '中暑',
  '熱衰竭',
  '溺水',
  '觸電',
  '蛇咬',
  '蜂螫',
  '臉部腫脹',
  '過敏性休克',
]

export class AiAssistantQuotaExceededError extends Error {
  constructor(message = QUOTA_EXCEEDED_MESSAGE) {
    super(message)
    this.name = 'AiAssistantQuotaExceededError'
  }
}

function containsEmergencyKeyword(message) {
  if (typeof message !== 'string') {
    return false
  }

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

export async function getAiAssistantReply(message, { geminiClient, env = process.env } = {}) {
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
        temperature: 0.4,
      },
    })

    const reply = response.text?.trim()

    return {
      reply: reply || '目前無法產生回覆，請稍後再試一次。',
    }
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new AiAssistantQuotaExceededError()
    }

    throw error
  }
}
