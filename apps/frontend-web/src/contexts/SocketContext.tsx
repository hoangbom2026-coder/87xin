/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { io, type Socket } from 'socket.io-client'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import { updateBalance } from '../features/auth/authSlice'
import { API_BASE } from '../constants/apiConfig'

type SocketContextValue = {
  socket: Socket | null
  connected: boolean
}

const SocketContext = React.createContext<SocketContextValue>({
  socket: null,
  connected: false,
})

export function useSocket(): SocketContextValue {
  return React.useContext(SocketContext)
}

function resolveSocketBaseUrl(): string {
  const api = String(API_BASE || '/api').trim()
  if (api.startsWith('http://') || api.startsWith('https://')) {
    return api.replace(/\/api\/?$/i, '')
  }
  return typeof window !== 'undefined' ? window.location.origin : ''
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const token = useSelector((s: RootState) => s.auth.token)
  const [socket, setSocket] = React.useState<Socket | null>(null)
  const [connected, setConnected] = React.useState(false)

  React.useEffect(() => {
    const base = resolveSocketBaseUrl()
    if (!base) return

    const authToken = token ? String(token) : ''
    const client = io(base, {
      path: '/socket.io',
      /** Polling trước — ổn định qua Nginx/Cloudflare; websocket upgrade sau. */
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 8000,
      withCredentials: true,
      query: authToken ? { auth: authToken } : {},
      auth: authToken ? { token: authToken } : undefined,
    })

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onBalance = (payload: { amount?: number }) => {
      if (payload?.amount != null) {
        dispatch(updateBalance(payload.amount))
      }
    }
    const onDepositSuccess = (detail: unknown) => {
      window.dispatchEvent(new CustomEvent('deposit_success', { detail }))
    }

    client.on('connect', onConnect)
    client.on('disconnect', onDisconnect)
    client.on('balance', onBalance)
    client.on('deposit_success', onDepositSuccess)
    setSocket(client)

    return () => {
      client.off('connect', onConnect)
      client.off('disconnect', onDisconnect)
      client.off('balance', onBalance)
      client.off('deposit_success', onDepositSuccess)
      client.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }, [token, dispatch])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}
