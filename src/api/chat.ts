import axios from 'axios'
import api from './client'

export type ChatRole = 'user' | 'assistant'
export type ChatMessage = { role: ChatRole; content: string }
export type ChatError = Error & { status?: number }

type ChatResponse = { reply: string }
type ChatErrorResponse = { error?: { message?: string } }

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function sendChat(message: string, history: ChatMessage[] = []): Promise<string> {
  if (message.length > 500) {
    throw Object.assign(new Error('Message must be 500 characters or fewer.'), { status: 400 }) as ChatError
  }

  if (USE_MOCK) {
    await new Promise((resolve) => window.setTimeout(resolve, 800))
    if (/mock error|mock fail/i.test(message)) {
      throw Object.assign(new Error('The mock assistant is temporarily unavailable.'), { status: 503 }) as ChatError
    }
    if (/code block|show code/i.test(message)) {
      return 'Here is a small example:\n\n```python\nfor number in range(3):\n    print(number)\n```\n\nLoops repeat a block of code. Great work exploring them!'
    }
    return `Great question! I can help you learn that step by step. You asked: “${message}”`
  }

  try {
    const response = await api.post<ChatResponse>('/chat', {
      message,
      history: history.slice(-8),
    })
    return response.data.reply
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    const data = axios.isAxiosError(error) ? (error.response?.data as ChatErrorResponse | undefined) : undefined
    const fallback = status === 429
      ? 'We’re getting lots of messages right now. Please try again shortly.'
      : status === 503
        ? 'The assistant is taking a short break. Please try again in a moment.'
        : status === 400
          ? 'I couldn’t send that message. Please check it and try again.'
          : 'I couldn’t reach the assistant. Please try again.'
    throw Object.assign(new Error(data?.error?.message || fallback), { status }) as ChatError
  }
}
