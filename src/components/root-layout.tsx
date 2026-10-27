import { useEffect, useState } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { MascotBot, useMascotMood } from './mascot-bot'
import { ChatPanel } from './chat/ChatPanel'
import happy from '../assets/characters/happy.png'
import celebrating from '../assets/characters/celebrating.png'
import sad from '../assets/characters/sad.png'

function getChatIdentity() {
  try {
    const profile = JSON.parse(localStorage.getItem('codelingo_profile') ?? '{}') as { email?: string; id?: string }
    if (profile.email || profile.id) return profile.email || profile.id || 'user'
  } catch { /* Use the token identity if cached profile is malformed. */ }

  const token = localStorage.getItem('token')
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { email?: string; sub?: string; id?: string }
      return payload.email || payload.id || payload.sub || token.slice(-12)
    } catch { return token.slice(-12) }
  }
  return 'user'
}

export function RootLayout() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem('token')))
  const [chatOpen, setChatOpen] = useState(false)
  const { mood, react } = useMascotMood()
  const identity = getChatIdentity()
  const storageKey = `codelingo-chat-history:${identity}`
  const canShowChat = hasToken && pathname !== '/login' && pathname !== '/register'

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem('token')))
  }, [pathname])

  useEffect(() => {
    const updateToken = () => setHasToken(Boolean(localStorage.getItem('token')))
    window.addEventListener('storage', updateToken)
    return () => window.removeEventListener('storage', updateToken)
  }, [])

  useEffect(() => {
    if (hasToken) return
    setChatOpen(false)
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index)
      if (key?.startsWith('codelingo-chat-history:')) sessionStorage.removeItem(key)
    }
  }, [hasToken])

  useEffect(() => {
    if (!canShowChat) setChatOpen(false)
  }, [canShowChat])

  return (
    <>
      <Outlet />
      {canShowChat && (
        <>
          <ChatPanel
            key={storageKey}
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            idleImage={happy}
            storageKey={storageKey}
            onCelebrate={() => react('celebrate')}
          />
          <MascotBot
            images={{ idle: happy, celebrate: celebrating, sad }}
            mood={mood}
            hideBubble={chatOpen}
            onClick={() => setChatOpen((open) => !open)}
            message="Need a hand with your coding journey?"
          />
        </>
      )}
    </>
  )
}
