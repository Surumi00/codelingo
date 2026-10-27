import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import './mascot-bot.css'

export type MascotMood = 'idle' | 'celebrate' | 'sad'

type MascotBotProps = {
  images: Record<MascotMood, string>
  mood?: MascotMood
  message?: string
  hideBubble?: boolean
  bubbleDelayMs?: number
  bubbleDurationMs?: number
  onClick?: () => void
}

const CONFETTI_COLORS = ['#8c4ff2', '#f7c948', '#4ade80', '#ff5d8f']
const CONFETTI = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2
  const distance = 64 + (i % 3) * 16
  return {
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance - 34,
    rot: (i % 2 ? 1 : -1) * (120 + i * 25),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }
})

export function MascotBot({
  images,
  mood = 'idle',
  message,
  hideBubble = false,
  bubbleDelayMs = 2000,
  bubbleDurationMs = 7000,
  onClick,
}: MascotBotProps) {
  const [bubbleOpen, setBubbleOpen] = useState(false)
  const [unread, setUnread] = useState(Boolean(message))
  const dismissed = useRef(false)

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => {
      if (!dismissed.current) setBubbleOpen(true)
    }, bubbleDelayMs)
    return () => window.clearTimeout(timer)
  }, [message, bubbleDelayMs])

  useEffect(() => {
    if (!bubbleOpen) return
    const timer = window.setTimeout(() => setBubbleOpen(false), bubbleDurationMs)
    return () => window.clearTimeout(timer)
  }, [bubbleOpen, bubbleDurationMs])

  function handleClick() {
    dismissed.current = true
    setBubbleOpen(false)
    setUnread(false)
    onClick?.()
  }

  function closeBubble() {
    dismissed.current = true
    setBubbleOpen(false)
  }

  return (
    <div className="mascot-bot" data-mood={mood}>
      {message && (
        <div className="mascot-bubble" role="status" hidden={!bubbleOpen || hideBubble}>
          {message}
          <button type="button" className="mascot-bubble-close" aria-label="Dismiss message" onClick={closeBubble}>
            ×
          </button>
        </div>
      )}
      <button type="button" className="mascot-btn" aria-label="Open chat assistant" onClick={handleClick}>
        <span className="mascot-shadow" />
        <span className="mascot-body">
          {(Object.keys(images) as MascotMood[]).map((key) => (
            <img key={key} src={images[key]} alt="" className={`mascot-img${mood === key ? ' is-active' : ''}`} draggable={false} />
          ))}
        </span>
        <span className="mascot-badge" hidden={!unread} />
        {mood === 'celebrate' && (
          <span className="mascot-confetti" aria-hidden="true">
            {CONFETTI.map((piece, i) => (
              <span
                key={i}
                className="confetti-piece"
                style={{
                  '--dx': `${piece.dx}px`,
                  '--dy': `${piece.dy}px`,
                  '--rot': `${piece.rot}deg`,
                  '--c': piece.color,
                } as CSSProperties}
              />
            ))}
          </span>
        )}
      </button>
    </div>
  )
}

export function useMascotMood() {
  const [mood, setMood] = useState<MascotMood>('idle')
  const timer = useRef<number | undefined>(undefined)

  function react(next: MascotMood, ms = 2600) {
    setMood(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMood('idle'), ms)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { mood, react }
}
