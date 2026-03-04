import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useUser } from '@/context/auth-provider'
import type { SendMessageRequest } from '../types/whatsapp.types'

interface UseWhatsAppSocketOptions {
  onMessage?: (message: any) => void
  onTyping?: (data: any) => void
  onRead?: (data: any) => void
  onNewMessage?: (message: any) => void
  onStatus?: (data: any) => void
}

export function useWhatsAppSocket(options: UseWhatsAppSocketOptions = {}) {
  const { user, isLoaded } = useUser()
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  const connect = useCallback(async () => {
    if (!user?.id || socketRef.current?.connected) {
      return
    }

    setConnecting(true)

    try {
      const socket = io(import.meta.env.VITE_WHATSAPP_SOCKET_URL || 'http://localhost:3001', {
        auth: {
          userId: user.id,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      })

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id)
        setConnected(true)
        setConnecting(false)
        reconnectAttemptsRef.current = 0
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
        setConnected(false)
      })

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setConnecting(false)

        // Auto-reconnect with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      })

      // WhatsApp message events
      socket.on('whatsapp:message', (data) => {
        console.log('New message:', data)
        options.onMessage?.(data)
      })

      socket.on('whatsapp:typing', (data) => {
        options.onTyping?.(data)
      })

      socket.on('whatsapp:read', (data) => {
        options.onRead?.(data)
      })

      socket.on('whatsapp:new_message', (data) => {
        console.log('New message received:', data)
        options.onNewMessage?.(data)
      })

      socket.on('whatsapp:message_status', (data) => {
        console.log('Message status update:', data)
        options.onStatus?.(data)
      })

      socket.on('whatsapp:unread', (data) => {
        console.log('Unread count update:', data)
      })

      socket.on('error', (error) => {
        console.error('Socket error:', error)
      })

      socketRef.current = socket
    } catch (error) {
      console.error('Failed to connect socket:', error)
      setConnecting(false)
    }
  }, [user?.id, options])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    setConnected(false)
  }, [])

  // Send message via socket
  const send = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }, [])

  // Send message
  const sendMessage = useCallback((data: SendMessageRequest) => {
    send('whatsapp:send', data)
  }, [send])

  // Send typing indicator
  const sendTyping = useCallback((contactId: string, isTyping: boolean) => {
    send('whatsapp:typing', { contactId, isTyping })
  }, [send])

  // Mark as read
  const markAsRead = useCallback((contactId: string) => {
    send('whatsapp:read', { contactId })
  }, [send])

  // Auto-connect when user is loaded
  useEffect(() => {
    if (isLoaded && user?.id) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [isLoaded, user?.id, connect, disconnect])

  return {
    connected,
    connecting,
    socket: socketRef.current,
    sendMessage,
    sendTyping,
    markAsRead,
    disconnect,
  }
}
