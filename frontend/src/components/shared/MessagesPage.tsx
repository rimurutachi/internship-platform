'use client';

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Send, Search, Paperclip, Smile, ArrowLeft, Edit, Trash2, Check, X, FileText, Image as ImageIcon, File, Download, PenSquare } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { messagesAPI, Message, Conversation } from '@/lib/api/messages';
import { connectBackendSocket, disconnectBackendSocket } from '@/lib/backendSocket';
import { useUser } from '@/hooks/use-user';
import { Socket } from 'socket.io-client';
import NewMessageModal from '@/components/student/NewMessageModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessagesPageProps {
  sidebar: ReactNode;
  header: ReactNode;
  userType: 'student' | 'advisor' | 'supervisor';
}

export function MessagesPage({ sidebar, header, userType }: MessagesPageProps) {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setError(null);
      const data = await messagesAPI.getConversations();
      setConversations(data);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setError(null);
      const data = await messagesAPI.getMessages(conversationId, { limit: 100 });
      // Reverse to show oldest first (backend returns newest first)
      setMessages(data.reverse());
      
      // Mark conversation as read
      await messagesAPI.markAsRead(conversationId);
      
      // Update conversation unread count locally
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      ));
      
      // Scroll to bottom after loading messages
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
    }
  }, []);

  // Send message (with optional file)
  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation || sending) return;

    const content = messageInput.trim();
    const file = selectedFile;
    
    setMessageInput(''); // Clear input immediately for better UX
    setSelectedFile(null);
    setFilePreview(null);
    
    try {
      setSending(true);
      setError(null);

      const newMessage = await messagesAPI.sendMessage(
        {
          conversation_id: selectedConversation,
          content: content || '',
          message_type: file ? 'file' : 'text',
        },
        file || undefined
      );

      // Add new message to the list (optimistic update)
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation's last message time
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation 
          ? { ...conv, last_message_at: new Date().toISOString() }
          : conv
      ));
      
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message');
      // Restore message input on error
      setMessageInput(content);
      setSelectedFile(file);
    } finally {
      setSending(false);
    }
  };

  // Handle edit message
  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const updatedMessage = await messagesAPI.editMessage(messageId, editContent.trim());
      
      // Update message in the list
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
      
      setEditingMessageId(null);
      setEditContent('');
    } catch (err: any) {
      console.error('Failed to edit message:', err);
      setError(err.message || 'Failed to edit message');
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await messagesAPI.deleteMessage(messageId);
      
      // Remove message from the list
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      setError(err.message || 'Failed to delete message');
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageInput(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!socketRef.current || !selectedConversation) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing event
    socketRef.current.emit('typing', { conversationId: selectedConversation });

    // Set timeout to stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { conversationId: selectedConversation });
    }, 2000);
  };

  // Handle conversation selection
  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowMobileChat(true);
    await loadMessages(conversationId);
  };

  // Handle back button (mobile)
  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedConversation('');
  };

  // Initialize
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!user?.id) return;

    const initSocket = async () => {
      const socket = await connectBackendSocket();
      socketRef.current = socket;

      socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Join user's personal room
    socket.emit('join_user_room', { userId: user.id });

    // Listen for new messages
    socket.on('new_message', (data: { message: Message }) => {
      const { message } = data;
      
      // If message is for current conversation, add it to the list
      if (message.conversation_id === selectedConversation) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        setTimeout(scrollToBottom, 100);
        
        // Mark as read immediately if conversation is open
        messagesAPI.markAsRead(message.conversation_id);
      } else {
        // Update unread count for other conversations
        setConversations(prev => prev.map(conv => 
          conv.id === message.conversation_id
            ? { ...conv, unread_count: (conv.unread_count || 0) + 1, last_message_at: message.created_at }
            : conv
        ));
      }
    });

    // Listen for message edits
    socket.on('message_edited', (data: { message: Message }) => {
      const { message } = data;
      if (message.conversation_id === selectedConversation) {
        setMessages(prev => prev.map(m => m.id === message.id ? message : m));
      }
    });

    // Listen for message deletions
    socket.on('message_deleted', (data: { messageId: string; conversationId: string }) => {
      if (data.conversationId === selectedConversation) {
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
      }
    });

    // Listen for typing indicators
    socket.on('user_typing', (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === selectedConversation && data.userId !== user.id) {
        setTypingUsers(prev => new Set(prev).add(data.userId));
      }
    });

    socket.on('user_stop_typing', (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === selectedConversation) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    });

    };

    initSocket();

    // Cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      disconnectBackendSocket();
    };
  }, [user?.id, selectedConversation]);

  // Get display name for conversation
  const getConversationName = (conv: Conversation): string => {
    if (conv.name) return conv.name;
    
    // For direct conversations, show the other participant's name
    const otherParticipant = conv.participants?.find(p => p.user_id !== user?.id);
    if (otherParticipant?.user) {
      return `${otherParticipant.user.first_name} ${otherParticipant.user.last_name}`;
    }
    
    return 'Unknown';
  };

  // Get conversation avatar initials
  const getConversationAvatar = (conv: Conversation): string => {
    const name = getConversationName(conv);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get file icon based on type
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Get current conversation details
  const currentConversation = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {sidebar}
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {header}
          
          <div className="flex-1 flex overflow-hidden bg-gray-50">
            {/* Conversations List */}
            <div className="w-96 bg-white border-r flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Messages</h2>
                  <Button 
                    size="sm" 
                    className="bg-[#4CAF50] hover:bg-[#45a049]"
                    onClick={() => setShowNewMessageModal(true)}
                  >
                    <PenSquare className="w-4 h-4 mr-2" />
                    New
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Conversations */}
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading conversations...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-[#4CAF50] text-white">
                            {getConversationAvatar(conv)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {getConversationName(conv)}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {new Date(conv.last_message_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate flex-1">
                              {conv.type === 'group' ? `Group • ${conv.participants?.length || 0} members` : 'Direct message'}
                            </p>
                            {(conv.unread_count || 0) > 0 && (
                              <Badge className="bg-[#4CAF50] text-white text-xs">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>

              {/* WebSocket Status */}
              <div className="p-3 border-t bg-gray-50">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-gray-600">
                    {socketConnected ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation && currentConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 bg-white border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-[#4CAF50] text-white">
                          {getConversationAvatar(currentConversation)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getConversationName(currentConversation)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {typingUsers.size > 0 ? (
                            <span className="text-[#4CAF50]">typing...</span>
                          ) : (
                            `${currentConversation.participants?.length || 0} ${currentConversation.type === 'group' ? 'members' : 'participant'}`
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        const isEditing = editingMessageId === msg.id;

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                              {/* Message Bubble */}
                              <div
                                className={`rounded-lg p-3 ${
                                  isOwn
                                    ? 'bg-[#4CAF50] text-white'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                {!isOwn && msg.sender && (
                                  <p className="text-xs font-semibold text-gray-900 mb-1">
                                    {msg.sender.first_name} {msg.sender.last_name}
                                  </p>
                                )}

                                {isEditing ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="bg-white text-black"
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleEditMessage(msg.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingMessageId(null);
                                          setEditContent('');
                                        }}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {msg.message_type === 'file' && msg.file_url && (
                                      <div className="mb-2 flex items-center gap-2 p-2 bg-white/10 rounded">
                                        {getFileIcon(msg.file_url)}
                                        <span className="text-sm flex-1 truncate">
                                          {msg.file_url.split('/').pop()}
                                        </span>
                                        <a href={msg.file_url} download>
                                          <Download className="w-4 h-4" />
                                        </a>
                                      </div>
                                    )}
                                    <p className={`text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                                      {msg.content}
                                    </p>
                                    {msg.is_edited && (
                                      <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                                        (edited)
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Timestamp and Actions */}
                              <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-xs text-gray-500">
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>

                                {isOwn && !msg.is_deleted && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <span className="text-xs">⋯</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditingMessageId(msg.id);
                                          setEditContent(msg.content);
                                        }}
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 bg-white border-t">
                    {selectedFile && (
                      <div className="mb-2 p-2 bg-gray-100 rounded flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {filePreview ? (
                            <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded" />
                          ) : (
                            getFileIcon(selectedFile.name)
                          )}
                          <span className="text-sm text-gray-700">{selectedFile.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setFilePreview(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>

                      <div className="relative flex-1">
                        <Input
                          value={messageInput}
                          onChange={(e) => {
                            setMessageInput(e.target.value);
                            handleTyping();
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Type a message..."
                          disabled={sending}
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={sending}
                      >
                        <Smile className="w-4 h-4" />
                      </Button>

                      <Button
                        onClick={handleSendMessage}
                        disabled={sending || (!messageInput.trim() && !selectedFile)}
                        className="bg-[#4CAF50] hover:bg-[#45a049]"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>

                    {showEmojiPicker && (
                      <div className="absolute bottom-20 right-4 z-50">
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <Send className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col">
        <MobileHeader title="Messages" subtitle="Stay connected" />

        {!showMobileChat ? (
          <>
            {/* Conversations List - Mobile */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 bg-white border-b">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    size="icon"
                    className="bg-[#4CAF50] hover:bg-[#45a049]"
                    onClick={() => setShowNewMessageModal(true)}
                  >
                    <PenSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No conversations</div>
                ) : (
                  filteredConversations.map((conv) => (
                    <Card
                      key={conv.id}
                      className="m-2 cursor-pointer"
                      onClick={() => handleSelectConversation(conv.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-[#4CAF50] text-white text-sm">
                              {getConversationAvatar(conv)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-sm truncate">
                                {getConversationName(conv)}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {new Date(conv.last_message_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-600 truncate flex-1">
                                {conv.type === 'group' ? `${conv.participants?.length || 0} members` : 'Direct'}
                              </p>
                              {(conv.unread_count || 0) > 0 && (
                                <Badge className="bg-[#4CAF50] text-white text-xs h-5">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </ScrollArea>
            </div>
          </>
        ) : (
          <>
            {/* Chat View - Mobile */}
            <div className="flex-1 flex flex-col">
              {/* Mobile Chat Header */}
              <div className="p-3 bg-white border-b flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleBackToList}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-[#4CAF50] text-white text-xs">
                    {currentConversation && getConversationAvatar(currentConversation)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">
                    {currentConversation && getConversationName(currentConversation)}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {typingUsers.size > 0 ? (
                      <span className="text-[#4CAF50]">typing...</span>
                    ) : (
                      'Active'
                    )}
                  </p>
                </div>
              </div>

              {/* Mobile Messages */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%]`}>
                          <div
                            className={`rounded-lg p-2 text-sm ${
                              isOwn
                                ? 'bg-[#4CAF50] text-white'
                                : 'bg-white border'
                            }`}
                          >
                            {!isOwn && msg.sender && (
                              <p className="text-xs font-semibold mb-1">
                                {msg.sender.first_name}
                              </p>
                            )}
                            <p>{msg.content}</p>
                          </div>
                          <span className="text-xs text-gray-500 mt-1 block">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Mobile Input */}
              <div className="p-3 bg-white border-t">
                <div className="flex items-center gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Message..."
                    disabled={sending}
                    className="flex-1 text-sm"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={sending || !messageInput.trim()}
                    className="bg-[#4CAF50] hover:bg-[#45a049] h-9 w-9"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        <BottomNavigation type={userType} />
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <NewMessageModal
          isOpen={showNewMessageModal}
          onClose={() => setShowNewMessageModal(false)}
          onConversationCreated={(conversationId) => {
            setShowNewMessageModal(false);
            handleSelectConversation(conversationId);
          }}
        />
      )}
    </div>
  );
}
