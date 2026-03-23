'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MoreVertical, Phone, Video, Paperclip, Smile, Send, Archive, UserPlus, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { WhatsAppChatProvider, useWhatsAppChat } from './whatsapp-chat-provider'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { WhatsAppContact, WhatsAppMessage } from '../types/whatsapp.types'

// Chat list component
function ChatList() {
  const { contacts, messages, activeContact, setActiveContact, contactsLoading, fetchMessages } = useWhatsAppChat()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredContacts = contacts.filter((contact: WhatsAppContact) =>
    contact.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone_number.includes(searchQuery)
  )

  const getUnreadCount = (contactId: string) => {
    const contactMessages = messages.get(contactId) || []
    return contactMessages.filter((m: WhatsAppMessage) => m.direction === 'incoming' && m.status === 'sent').length
  }

  const getLastMessage = (contactId: string) => {
    const contactMessages = messages.get(contactId) || []
    return contactMessages[contactMessages.length - 1]
  }

  const handleContactClick = async (contact: WhatsAppContact) => {
    setActiveContact(contact)
    await fetchMessages(contact.id)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Mesajlar</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Canlı · {contacts.length} kişi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Kişi veya telefon ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {contactsLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-48 bg-slate-50 dark:bg-slate-800/50 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Search className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Kişi bulunamadı</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {filteredContacts.map((contact, index) => {
              const lastMessage = getLastMessage(contact.id)
              const unreadCount = getUnreadCount(contact.id)
              const isActive = activeContact?.id === contact.id

              return (
                <button
                  key={contact.id}
                  onClick={() => handleContactClick(contact)}
                  className={`w-full p-4 flex items-center gap-3 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                    isActive ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500' : ''
                  }`}
                  style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both` }}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.profile_pic_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                        {contact.full_name?.charAt(0).toUpperCase() || contact.phone_number.slice(-2)}
                      </AvatarFallback>
                    </Avatar>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {contact.full_name || contact.phone_number}
                      </h4>
                      {lastMessage && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true, locale: tr })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate pr-2">
                        {lastMessage ? (
                          lastMessage.direction === 'outgoing' ? (
                            <span className="flex items-center gap-1">
                              <span className="text-blue-500">✓</span> {lastMessage.content}
                            </span>
                          ) : (
                            lastMessage.content
                          )
                        ) : (
                          <span className="text-slate-400">Henüz mesaj yok</span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Message bubble component
function MessageBubble({ message, isOwn }: { message: WhatsAppMessage; isOwn: boolean }) {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <span className="text-blue-400">✓</span>
      case 'delivered':
        return <span className="text-blue-400">✓✓</span>
      case 'read':
        return <span className="text-blue-500">✓✓</span>
      case 'failed':
        return <span className="text-red-500">!</span>
      default:
        return null
    }
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
        isOwn
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md'
      }`}>
        {message.message_type === 'text' && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        )}
        {message.message_type === 'image' && message.media_url && (
          <div className="space-y-2">
            <img src={message.media_url} alt="Media" className="rounded-lg max-w-full" loading="lazy" />
            {message.content && <p className="text-sm">{message.content}</p>}
          </div>
        )}
        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-blue-100' : 'text-slate-400'}`}>
          <span className="text-xs">
            {message.sent_at && formatDistanceToNow(new Date(message.sent_at), { locale: tr })}
          </span>
          {isOwn && message.direction === 'outgoing' && getStatusIcon()}
        </div>
      </div>
    </div>
  )
}

// Chat area component
function ChatArea() {
  const {
    activeContact,
    messages,
    messagesLoading,
    sendMessage,
    markAsRead,
  } = useWhatsAppChat()

  const [messageInput, setMessageInput] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const contactMessages = activeContact ? messages.get(activeContact.id) || [] : []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [contactMessages, activeContact])

  useEffect(() => {
    if (activeContact) {
      markAsRead(activeContact.id)
    }
  }, [activeContact, markAsRead])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeContact) return

    try {
      await sendMessage({
        to: activeContact.phone_number,
        message: messageInput.trim(),
      })
      setMessageInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!activeContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50">
        <div className="text-center max-w-md p-8">
          <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            WhatsApp Web
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Mesaj göndermek ve almak için bir sohbet seçin
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={activeContact.profile_pic_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
              {activeContact.full_name?.charAt(0).toUpperCase() || activeContact.phone_number.slice(-2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              {activeContact.full_name || activeContact.phone_number}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{activeContact.phone_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messagesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-center">
                <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : contactMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="h-16 w-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Smile className="h-8 w-8" />
            </div>
            <p className="text-sm">Bu sohbet şimdilik boş</p>
            <p className="text-xs mt-1">İlk mesajı gönderin!</p>
          </div>
        ) : (
          <>
            {contactMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.direction === 'outgoing'}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-slate-500 hover:text-slate-700"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,document/*"
          />

          <div className="flex-1 relative">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Mesaj yaz..."
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-blue-500 resize-none max-h-32 text-sm"
              style={{ minHeight: '44px' }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-1/2 translate-y-1/2 h-7 w-7 text-slate-400 hover:text-slate-600"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Main chat component
export function WhatsAppChat() {
  return (
    <WhatsAppChatProvider>
      <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <ChatList />
        <ChatArea />
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </WhatsAppChatProvider>
  )
}
