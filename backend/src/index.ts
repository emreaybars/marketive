import 'dotenv/config'
import express, { Request, Response } from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { Server as SocketIOServer } from 'socket.io'
import { socketService } from './services/socket.service'
import whatsappRouter from './routes/whatsapp'
import { verifyWebhook, handleWebhook } from './webhooks/whatsapp.webhook'

const app = express()
const httpServer = createServer(app)

// Initialize Socket.io
socketService.initialize(httpServer)

const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(compression())
app.use(cors({
  origin: FRONTEND_URL.split(','),
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    onlineUsers: socketService.getOnlineUsersCount(),
  })
})

// WhatsApp webhook endpoints
app.get('/webhooks/whatsapp', verifyWebhook)
app.post('/webhooks/whatsapp', handleWebhook)

// API routes
app.use('/api/whatsapp', whatsappRouter)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 WhatsApp API Server running on port ${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
  console.log(`🔌 Socket.io initialized`)
  console.log(`🌐 CORS enabled for: ${FRONTEND_URL}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
