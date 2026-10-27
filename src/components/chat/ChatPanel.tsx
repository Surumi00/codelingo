import { useEffect, useRef, useState } from 'react'
import { sendChat, type ChatError, type ChatMessage } from '../../api/chat'
import './chat-panel.css'

type ChatPanelProps = {
  open: boolean
  onClose: () => void
  idleImage: string
  storageKey: string
  onCelebrate: () => void
}

type DisplayMessage = ChatMessage & { id: number }

const SUGGESTIONS = [
  'How was my last week?',
  'What should I practice next?',
  'Explain loops simply',
]

function readHistory(key: string): ChatMessage[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(key) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is ChatMessage =>
      item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string',
    )
  } catch {
    return []
  }
}

function renderText(content: string) {
  const parts: React.ReactNode[] = []
  const tokens = /```([^\n`]*)\n([\s\S]*?)```|`([^`\n]+)`/g
  let cursor = 0
  let index = 0
  for (const match of content.matchAll(tokens)) {
    const start = match.index ?? 0
    if (start > cursor) {
      parts.push(renderLineBreaks(content.slice(cursor, start), `text-${index++}`))
    }
    if (match[2] !== undefined) {
      parts.push(<pre className="chat-code-block" key={`code-${index++}`}><code>{match[2]}</code></pre>)
    } else {
      parts.push(<code className="chat-inline-code" key={`inline-${index++}`}>{match[3]}</code>)
    }
    cursor = start + match[0].length
  }
  if (cursor < content.length) parts.push(renderLineBreaks(content.slice(cursor), `text-${index}`))
  return parts
}

function renderLineBreaks(text: string, key: string) {
  return text.split('\n').flatMap((line, index) => index === 0
    ? [line]
    : [<br key={`${key}-br-${index}`} />, line])
}

export function ChatPanel({ open, onClose, idleImage, storageKey, onCelebrate }: ChatPanelProps) {
  const [history, setHistory] = useState<ChatMessage[]>(() => readHistory(storageKey))
  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    readHistory(storageKey).map((message, index) => ({ ...message, id: index + 1 })),
  )
  const [draft, setDraft] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState<{ message: string; status?: number } | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(messages.length + 1)
  const lastRequestRef = useRef<{ message: string; context: ChatMessage[] } | null>(null)

  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(history)) } catch { /* Storage may be unavailable. */ }
  }, [history, storageKey])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, waiting, error])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  async function requestReply(message: string, context: ChatMessage[]) {
    setWaiting(true)
    setError(null)
    try {
      const reply = await sendChat(message, context)
      const assistantMessage: ChatMessage = { role: 'assistant', content: reply }
      setHistory([...context, { role: 'user', content: message }, assistantMessage])
      setMessages((current) => [...current, { ...assistantMessage, id: idRef.current++ }])
      if (/\b(great|well done)\b/i.test(reply)) onCelebrate()
      lastRequestRef.current = null
    } catch (caught) {
      const chatError = caught as ChatError
      const status = chatError.status
      const message = status === 429
        ? 'We’re getting lots of messages right now. Please try again shortly.'
        : chatError.message || 'I couldn’t reach the assistant. Please try again.'
      setError({ message, status })
    } finally {
      setWaiting(false)
    }
  }

  function submitMessage(value = draft) {
    const message = value.trim()
    if (!message || waiting || message.length > 500) return
    const userMessage: ChatMessage = { role: 'user', content: message }
    const context = history
    lastRequestRef.current = { message, context }
    setMessages((current) => [...current, { ...userMessage, id: idRef.current++ }])
    setDraft('')
    void requestReply(message, context)
  }

  function retry() {
    const lastRequest = lastRequestRef.current
    if (lastRequest && !waiting) void requestReply(lastRequest.message, lastRequest.context)
  }

  function newChat() {
    setHistory([])
    setMessages([])
    setError(null)
    setDraft('')
    lastRequestRef.current = null
    try { sessionStorage.removeItem(storageKey) } catch { /* Storage may be unavailable. */ }
    inputRef.current?.focus()
  }

  if (!open) return null

  return (
    <section className="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title">
      <header className="chat-header">
        <img src={idleImage} alt="" className="chat-header-avatar" />
        <h2 id="chat-title">CodeLingo Buddy</h2>
        <button type="button" className="chat-new-button" onClick={newChat}>New chat</button>
        <button type="button" className="chat-close-button" aria-label="Close chat" onClick={onClose}>×</button>
      </header>

      <div className="chat-messages" ref={listRef} aria-live="polite" aria-relevant="additions text">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <img src={idleImage} alt="" className="chat-empty-avatar" />
            <p>Hi! I’m your CodeLingo Buddy. What are you learning today?</p>
            <div className="chat-suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button type="button" key={suggestion} onClick={() => submitMessage(suggestion)} disabled={waiting}>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : messages.map((message) => (
          <div key={message.id} className={`chat-message-row ${message.role === 'user' ? 'is-user' : 'is-assistant'}`}>
            {message.role === 'assistant' && <img src={idleImage} alt="" className="chat-message-avatar" />}
            <div className="chat-message-bubble">{renderText(message.content)}</div>
          </div>
        ))}
        {waiting && (
          <div className="chat-message-row is-assistant" role="status" aria-label="CodeLingo Buddy is typing">
            <img src={idleImage} alt="" className="chat-message-avatar" />
            <div className="chat-typing" aria-hidden="true"><i /><i /><i /></div>
          </div>
        )}
        {error && (
          <div className="chat-message-row is-assistant">
            <img src={idleImage} alt="" className="chat-message-avatar" />
            <div className="chat-error" role="alert">
              <span>{error.message}</span>
              <button type="button" onClick={retry} disabled={waiting}>Retry</button>
            </div>
          </div>
        )}
      </div>

      <form className="chat-input-area" onSubmit={(event) => { event.preventDefault(); submitMessage() }}>
        <div className="chat-input-row">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 500))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submitMessage()
              }
            }}
            placeholder="Ask CodeLingo Buddy..."
            aria-label="Message CodeLingo Buddy"
            maxLength={500}
            rows={2}
          />
          <button className="chat-send-button" type="submit" disabled={!draft.trim() || waiting} aria-label="Send message">↑</button>
        </div>
        {draft.length >= 450 && <span className="chat-character-count">{draft.length}/500</span>}
      </form>
    </section>
  )
}
