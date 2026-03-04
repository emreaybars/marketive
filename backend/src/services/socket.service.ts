import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import type { SocketMessage } from '../types/whatsapp.types'

interface AuthenticatedSocket extends Socket {
  userId?: string
}

// Socket.io service for real-time updates
export class SocketService {
  private io: SocketIOServer | null = null
  private users = new Map<string, Set<string>>() // userId -> Set of socketIds

  initialize(httpServer: HTTPServer) {
    const corsOrigin = process.env.SOCKET_CORS_ORIGIN?.split(',') || ['http://localhost:5173']

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    })

    this.setupMiddleware()
    this.setupHandlers()

    console.log('Socket.io server initialized')
  }

  private setupMiddleware() {
    if (!this.io) return

    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')

      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      try {
        // For Clerk JWT, we need to verify with Clerk or use a simpler approach
        // For now, we'll accept the user_id directly in handshake (to be updated with proper JWT verification)
        const userId = socket.handshake.auth.userId || socket.handshake.query.userId

        if (!userId) {
          return next(new Error('Authentication error: Invalid token'))
        }

        socket.userId = userId
        next()
      } catch (error) {
        next(new Error('Authentication error'))
      }
    })
  }

  private setupHandlers() {
    if (!this.io) return

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!
      const socketId = socket.id

      console.log(`User connected: ${userId}, socket: ${socketId}`)

      // Track user connections
      if (!this.users.has(userId)) {
        this.users.set(userId, new Set())
      }
      this.users.get(userId)!.add(socketId)

      // Join user's personal room
      socket.join(`user:${userId}`)

      // Send initial unread count
      this.sendUnreadCount(userId)

      // Handle incoming messages
      socket.on('whatsapp:message', async (data) => {
        // Broadcast to all user's sockets
        this.io!.to(`user:${userId}`).emit('whatsapp:message', data)
      })

      // Handle typing indicators
      socket.on('whatsapp:typing', (data) => {
        socket.to(`user:${userId}`).emit('whatsapp:typing', data)
      })

      // Handle read receipts
      socket.on('whatsapp:read', (data) => {
        socket.to(`user:${userId}`).emit('whatsapp:read', data)
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}, socket: ${socketId}`)

        // Remove socket from user tracking
        const userSockets = this.users.get(userId)
        if (userSockets) {
          userSockets.delete(socketId)
          if (userSockets.size === 0) {
            this.users.delete(userId)
          }
        }
      })
    })
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data)
    }
  }

  // Emit unread count update
  sendUnreadCount(userId: string) {
    // This will be called by the routes to update unread count
    this.emitToUser(userId, 'whatsapp:unread', { count: 0 })
  }

  // Broadcast new message
  broadcastNewMessage(userId: string, message: any) {
    this.emitToUser(userId, 'whatsapp:new_message', message)
  }

  // Broadcast message status update
  broadcastMessageStatus(userId: string, messageId: string, status: string) {
    this.emitToUser(userId, 'whatsapp:message_status', { messageId, status })
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.users.size
  }

  // Get connected sockets for a user
  getUserSocketCount(userId: string): number {
    return this.users.get(userId)?.size || 0
  }
}

export const socketService = new SocketService()
