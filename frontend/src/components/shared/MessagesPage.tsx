"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useBackendSocket, useSocketEvent } from '@/hooks/use-backend-socket';
import { messagesApi, Contact, Message } from '@/lib/api/messages';
import { Send, Search, Loader2, Smile, MessageSquareDashed, ChevronLeft } from 'lucide-react';
import { useTheme } from 'next-themes';

import { format, isToday, isYesterday, isSameDay } from 'date-fns';

// Lazy load emoji picker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface MessagesPageProps {
  currentUser: {
    id: string;
    role: string;
    first_name: string;
    last_name: string;
  };
}

function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-rose-500 to-pink-600',
    'from-indigo-500 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDateSeparator(date: Date) {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

function getRoleBadgeStyle(role: string) {
  switch (role) {
    case 'advisor': return 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300';
    case 'supervisor': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
    case 'student': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
    default: return 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300';
  }
}

export default function MessagesPage({ currentUser }: MessagesPageProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const { socket, isConnected } = useBackendSocket();

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load Contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoadingContacts(true);
        const data = await messagesApi.getContacts();
        setContacts(data);
      } catch (error) {
        console.error('Failed to load contacts:', error);
      } finally {
        setIsLoadingContacts(false);
      }
    };
    fetchContacts();
  }, []);

  // Load Messages when contact changes
  useEffect(() => {
    if (!selectedContact) return;
    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const data = await messagesApi.getMessages(selectedContact.id);
        setMessages(data);
        const unreadIds = data
          .filter(m => m.receiver_id === currentUser.id && !m.is_read)
          .map(m => m.id);
        if (unreadIds.length > 0) {
          await messagesApi.markAsRead(unreadIds);
          socket?.emit('mark_messages_read', { messageIds: unreadIds });
          setContacts(prev => prev.map(c => 
            c.id === selectedContact.id ? { ...c, unread_count: 0 } : c
          ));
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedContact, currentUser.id, socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle real-time incoming messages
  useSocketEvent('receive_message', (message: Message) => {
    if (
      selectedContact &&
      (message.sender_id === selectedContact.id || message.receiver_id === selectedContact.id)
    ) {
      setMessages(prev => [...prev, message]);
      if (message.receiver_id === currentUser.id) {
        socket?.emit('mark_messages_read', { messageIds: [message.id] });
      }
    } else if (message.receiver_id === currentUser.id) {
      setContacts(prev => prev.map(c => 
        c.id === message.sender_id ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c
      ));
    }
  });

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !socket) return;
    socket.emit('send_message', {
      receiverId: selectedContact.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, [newMessage, selectedContact, socket]);

  const handleEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setIsMobileChatOpen(true);
    setShowEmojiPicker(false);
  };

  const filteredContacts = contacts.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Build message groups with date separators
  const messageGroups: { type: 'separator'; date: Date } | { type: 'message'; message: Message }[] = [];
  messages.forEach((msg, idx) => {
    const msgDate = new Date(msg.created_at);
    const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at) : null;
    if (!prevDate || !isSameDay(msgDate, prevDate)) {
      (messageGroups as any[]).push({ type: 'separator', date: msgDate });
    }
    (messageGroups as any[]).push({ type: 'message', message: msg });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Shared sub-components
  // ──────────────────────────────────────────────────────────────────────────

  const renderContactList = () => (
    <div className="flex-1 overflow-y-auto">
      {isLoadingContacts ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 p-6">
          <MessageSquareDashed className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
          <p className="text-sm text-slate-400 dark:text-zinc-400 text-center">
            {searchTerm ? 'No contacts match your search' : 'No contacts yet'}
          </p>
        </div>
      ) : (
        filteredContacts.map(contact => {
          const isActive = selectedContact?.id === contact.id;
          const avatarGradient = getAvatarColor(contact.first_name + contact.last_name);
          return (
            <button
              key={contact.id}
              onClick={() => handleContactSelect(contact)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all duration-150 relative hover-lift
                ${isActive
                  ? 'bg-violet-50 dark:bg-violet-500/10 border-r-2 border-r-violet-500'
                  : 'hover:bg-slate-50/70 dark:hover:bg-white/5 border-r-2 border-r-transparent'
                }
              `}
            >
              {/* Avatar */}
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm`}>
                {getInitials(contact.first_name, contact.last_name)}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className={`font-medium text-sm truncate ${isActive ? 'text-violet-700 dark:text-violet-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                    {contact.first_name} {contact.last_name}
                  </h3>
                </div>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium capitalize ${getRoleBadgeStyle(contact.role)}`}>
                  {contact.role}
                </span>
              </div>
              {contact.unread_count ? (
                <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 animate-pulse">
                  {contact.unread_count > 99 ? '99+' : contact.unread_count}
                </div>
              ) : (
                isActive && (
                  <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                )
              )}
            </button>
          );
        })
      )}
    </div>
  );

  const renderChatMessages = () => (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 scroll-smooth bg-muted/20 bg-[radial-gradient(circle_at_1px_1px,hsl(0_0%_0%/0.06)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,hsl(0_0%_100%/0.04)_1px,transparent_0)] bg-[size:24px_24px]">
      {isLoadingMessages ? (
        <div className="flex justify-center items-center h-full">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <p className="text-xs text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      ) : messageGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-500/20 dark:to-blue-500/20 flex items-center justify-center">
            <MessageSquareDashed className="w-10 h-10 text-violet-300 dark:text-violet-400" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground text-sm">Start the conversation</p>
            <p className="text-xs text-muted-foreground mt-1">Send a message to {selectedContact?.first_name}</p>
          </div>
        </div>
      ) : (
        (messageGroups as any[]).map((item: any, idx: number) => {
          if (item.type === 'separator') {
            return (
              <div key={`sep-${idx}`} className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                <span className="text-[11px] text-muted-foreground font-medium px-2 bg-background/80 rounded-full border border-border backdrop-blur-sm">
                  {formatDateSeparator(item.date)}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
              </div>
            );
          }
          const msg: Message = item.message;
          const isMine = msg.sender_id === currentUser.id;
          const avatarGradient = getAvatarColor(
            isMine ? currentUser.first_name + currentUser.last_name : (selectedContact?.first_name ?? '') + (selectedContact?.last_name ?? '')
          );
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} group`}
            >
              {/* Avatar for other person */}
              {!isMine && (
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mb-1`}>
                  {getInitials(selectedContact?.first_name ?? '', selectedContact?.last_name ?? '')}
                </div>
              )}
              <div className={`flex flex-col gap-1 max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`
                    relative px-4 py-2.5 text-sm leading-relaxed shadow-sm
                    ${isMine
                      ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-2xl rounded-br-sm'
                      : 'bg-card text-foreground border border-border rounded-2xl rounded-bl-sm'
                    }
                  `}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {format(new Date(msg.created_at), 'h:mm a')}
                </span>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  const renderChatInput = (mobile: boolean = false) => (
    <div className={`relative ${mobile ? 'p-3' : 'px-6 py-4'} bg-card border-t border-border z-10`}>
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className={`absolute ${mobile ? 'bottom-16 left-2' : 'bottom-20 left-6'} z-50 shadow-2xl rounded-2xl overflow-hidden border border-border`}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            height={380}
            width={320}
            searchDisabled={false}
            skinTonesDisabled
            theme={(mounted && (resolvedTheme || theme) === 'dark') ? 'dark' as any : 'light' as any}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(v => !v)}
          className={`flex-shrink-0 p-2 rounded-xl transition-all duration-150 ${showEmojiPicker ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-white/5'}`}
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder={isConnected ? `Message ${selectedContact?.first_name}...` : 'Connecting...'}
          disabled={!isConnected}
          className="flex-1 bg-muted border border-border text-foreground placeholder-muted-foreground px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
          onKeyDown={e => {
            if (e.key === 'Escape') setShowEmojiPicker(false);
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !isConnected}
          className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white rounded-xl flex items-center justify-center shadow-md shadow-violet-200 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-[500px] w-full bg-background overflow-hidden flex flex-col rounded-xl border border-border shadow-sm">
      {/* ── DESKTOP ── */}
      <div className="hidden lg:flex flex-1 bg-muted/40">

            {/* ── Contacts panel ── */}
            <div className="w-[300px] xl:w-[340px] flex-shrink-0 flex flex-col bg-card border-r border-border h-full">
              {/* Header */}
              <div className="px-5 pt-6 pb-4 border-b border-border">
                <h1 className="text-xl font-bold text-foreground tracking-tight mb-4">Messages</h1>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Contact count chip */}
              {!isLoadingContacts && filteredContacts.length > 0 && (
                <div className="px-5 py-2 border-b border-border bg-muted/40">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    {filteredContacts.length} {filteredContacts.length === 1 ? 'Contact' : 'Contacts'}
                  </span>
                </div>
              )}

              {renderContactList()}
            </div>

            {/* ── Chat panel ── */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {selectedContact ? (
                <>
                  {/* Chat header */}
                  <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(selectedContact.first_name + selectedContact.last_name)} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}>
                        {getInitials(selectedContact.first_name, selectedContact.last_name)}
                      </div>
                      <div>
                        <h2 className="font-semibold text-foreground text-sm leading-tight">
                          {selectedContact.first_name} {selectedContact.last_name}
                        </h2>
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium capitalize ${getRoleBadgeStyle(selectedContact.role)}`}>
                          {selectedContact.role}
                        </span>
                      </div>
                    </div>
                    
                  </div>

                  {/* Messages */}
                  {renderChatMessages()}

                  {/* Input */}
                  {renderChatInput()}
                </>
              ) : (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 bg-muted/30">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
                      <MessageSquareDashed className="w-12 h-12 text-violet-300" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                      <span className="text-white text-xs">✨</span>
                    </div>
                  </div>
                  <div className="text-center max-w-xs">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Your Inbox</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Select a contact from the left to start or continue a conversation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

      {/* ── MOBILE ── */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden bg-background">
        {/* Mobile: Contacts view */}
        {!isMobileChatOpen ? (
          <div className="flex-1 overflow-hidden flex flex-col bg-card">
            {/* Search */}
              <div className="px-4 py-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              {renderContactList()}
            </div>
        ) : (
          /* Mobile: Chat view (slide-in overlay) */
          <div className="flex flex-col h-full bg-card">
            {/* Mobile chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
              <button
                onClick={() => { setIsMobileChatOpen(false); setShowEmojiPicker(false); }}
                className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {selectedContact && (
                <>
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(selectedContact.first_name + selectedContact.last_name)} flex items-center justify-center text-white font-semibold text-xs shadow-sm`}>
                    {getInitials(selectedContact.first_name, selectedContact.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-foreground text-sm truncate">
                      {selectedContact.first_name} {selectedContact.last_name}
                    </h2>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${getRoleBadgeStyle(selectedContact.role)}`}>
                      {selectedContact.role}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {renderChatMessages()}
            </div>
            {renderChatInput(true)}
          </div>
        )}
      </div>
    </div>
  );
}
