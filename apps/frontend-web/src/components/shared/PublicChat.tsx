import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { X, Send, Smile, Info, Users, Settings2, Trash2 } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useChat } from '../../contexts/ChatContext'
import { useSocket } from '../../contexts/SocketContext'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { resolveAvatar } from '../../utils/avatarUrl'
import { cn } from '../../lib/cn'
import Button from '../ui/Button'

interface Message {
  id: string
  username: string
  avatar?: string
  content: string
  timestamp: number
  level?: number
  isBot?: boolean
}

const PublicChat: React.FC = () => {
  const { t } = useLanguage()
  const { isChatOpen, closeChat } = useChat()
  const { socket, connected } = useSocket()
  const { user } = useSelector((state: RootState) => state.auth)
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      username: 'System',
      content: t('chat.welcome', 'Chào mừng bạn đến với kênh trò chuyện! Vui lòng tôn trọng người khác.'),
      timestamp: Date.now(),
      isBot: true
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Tải tin nhắn mẫu hoặc lắng nghe socket
  useEffect(() => {
    if (!socket) return

    const handleBotChat = (data: any) => {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        username: data.username || 'Bot',
        avatar: data.avatar,
        content: data.message || data.content,
        timestamp: Date.now(),
        isBot: true,
        level: Math.floor(Math.random() * 50)
      }
      setMessages(prev => [...prev.slice(-49), newMessage])
    }

    const handlePublicMessage = (data: any) => {
      const newMessage: Message = {
        id: data.id || Math.random().toString(36).substr(2, 9),
        username: data.username,
        avatar: data.avatar,
        content: data.content,
        timestamp: data.timestamp || Date.now(),
        level: data.level
      }
      setMessages(prev => [...prev.slice(-49), newMessage])
    }

    socket.on('bot-chat', handleBotChat)
    socket.on('public-message', handlePublicMessage)

    return () => {
      socket.off('bot-chat')
      socket.off('public-message')
    }
  }, [socket])

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputValue.trim()) return

    if (!user) {
      // Show auth modal or toast
      return
    }

    if (socket && connected) {
      const payload = {
        content: inputValue.trim(),
        username: user.username,
        avatar: user.avatar,
        level: user.level || 1,
        timestamp: Date.now()
      }
      socket.emit('public-message', payload)
      
      // Tạm thời add vào local để trải nghiệm mượt (nếu backend không emit ngược lại ngay)
      const myMsg: Message = {
        id: 'temp-' + Date.now(),
        ...payload
      }
      setMessages(prev => [...prev.slice(-49), myMsg])
      setInputValue('')
    }
  }

  return (
    <aside
      className={cn(
        'fixed top-0 right-0 z-[2000] h-full w-full sm:w-[320px] bg-[#1e2024] border-l border-white/5 transition-transform duration-300 shadow-2xl flex flex-col',
        isChatOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="h-[56px] px-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#1e2024]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-black tracking-tight uppercase">{t('chat.title', 'Trò chuyện')}</span>
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50 font-bold ml-1 uppercase">{language}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <Settings2 size={16} />
          </button>
          <button 
            className="p-2 text-white/40 hover:text-white transition-colors"
            onClick={closeChat}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Info Bar */}
      <div className="px-4 py-2 bg-black/20 flex items-center justify-between text-[10px] text-white/40 font-bold border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
             <Users size={12} />
             <span>1,284 {t('chat.online', 'Trực tuyến')}</span>
          </div>
        </div>
        <button className="flex items-center gap-1 hover:text-white transition-colors">
           <Info size={12} />
           <span>{t('chat.rules', 'Luật chat')}</span>
        </button>
      </div>

      {/* Message List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3 group">
            <div className="shrink-0 pt-1">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                <img 
                  src={resolveAvatar({ avatar: msg.avatar })} 
                  alt="" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/images/avatars/default.png' }}
                />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={cn(
                  "text-[11px] font-black tracking-wide truncate",
                  msg.isBot ? "text-emerald-400" : "text-brand-textGray"
                )}>
                  {msg.username}
                </span>
                {msg.level !== undefined && (
                   <span className="text-[9px] bg-primary/20 text-primary px-1 rounded font-bold leading-none py-0.5">
                     Lv.{msg.level}
                   </span>
                )}
                <span className="text-[9px] text-white/20 font-medium ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={cn(
                "text-[13px] leading-relaxed break-words py-1.5 px-3 rounded-2xl inline-block max-w-full",
                msg.isBot ? "bg-emerald-500/5 text-emerald-100/90" : "bg-white/5 text-white/90"
              )}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#1e2024] border-t border-white/5 shrink-0">
        <form 
          onSubmit={handleSendMessage}
          className="relative"
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={user ? t('chat.placeholder', 'Nhập tin nhắn…') : t('chat.loginRequired', 'Vui lòng đăng nhập để chat')}
            disabled={!user}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 pr-24 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors resize-none min-h-[48px] max-h-[120px]"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button 
              type="button"
              className="p-1.5 text-white/30 hover:text-white transition-colors"
              disabled={!user}
            >
              <Smile size={18} />
            </button>
            <button 
              type="submit"
              disabled={!user || !inputValue.trim()}
              className="bg-primary hover:bg-primary-hover disabled:bg-white/5 disabled:text-white/20 text-white p-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
        {!user && (
          <p className="mt-2 text-[10px] text-center text-white/30 font-bold uppercase tracking-widest">
            {t('chat.identityRequired', 'Cần xác thực danh tính để chat')}
          </p>
        )}
      </div>
    </aside>
  )
}

export default PublicChat
