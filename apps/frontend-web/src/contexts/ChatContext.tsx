/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'

interface ChatContextType {
  isChatOpen: boolean
  toggleChat: () => void
  openChat: () => void
  closeChat: () => void
}

const ChatContext = createContext<ChatContextType>({
  isChatOpen: false,
  toggleChat: () => {},
  openChat: () => {},
  closeChat: () => {},
})

export const useChat = () => useContext(ChatContext)

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const toggleChat = () => setIsChatOpen(prev => !prev)
  const openChat = () => setIsChatOpen(true)
  const closeChat = () => setIsChatOpen(false)

  // Tự động đóng chat khi resize xuống mobile nếu đang mở (tuỳ chọn)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && isChatOpen) {
        // setIsChatOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isChatOpen])

  return (
    <ChatContext.Provider value={{ isChatOpen, toggleChat, openChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  )
}
