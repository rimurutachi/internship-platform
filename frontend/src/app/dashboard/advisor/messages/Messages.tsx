'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, PenSquare, Paperclip, Smile, ArrowLeft, Edit, Trash2, Check, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function Messages() {
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
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
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

  // Load messages
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setError(null);
      const data = await messagesAPI.getMessages(conversationId, { limit: 100 });
      setMessages(data.reverse());
      await messagesAPI.markAsRead(conversationId);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
    }
  }, []);

  // Send message
  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation || sending) return;

    const content = messageInput.trim();
    const file = selectedFile;
    
    setMessageInput('');
    setSelectedFile(null);
    setFilePreview(null);

    try {
      setSending(true);
      setError(null);

      if (socketRef.current) {
        socketRef.current.emit('stop_typing', { conversationId: selectedConversation });
      }

      await messagesAPI.sendMessage({
        conversation_id: selectedConversation,
        content: content || (file ? file.name : ''),
        message_type: file ? 'file' : 'text',
      }, file || undefined);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message');
      setMessageInput(content);
      if (file) setSelectedFile(file);
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Remove file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle emoji
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Handle typing
  const handleTyping = () => {
    if (!socketRef.current || !selectedConversation || !user) return;

    socketRef.current.emit('typing', {
      conversationId: selectedConversation,
      userName: `${user.first_name} ${user.last_name}`,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('stop_typing', { conversationId: selectedConversation });
      }
    }, 2000);
  };

  // Setup Socket.io
  useEffect(() => {
    if (!user?.id) return;

    const setupSocket = async () => {
      try {
        const socket = await connectBackendSocket();
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Socket connected for messages');
          setSocketConnected(true);
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
          setSocketConnected(false);
        });

        socket.emit('join_user_room', user.id);

        socket.on('new_message', (message: Message) => {
          console.log('New message received:', message);
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
          loadConversations();

          if (message.conversation_id === selectedConversation) {
            messagesAPI.markAsRead(message.conversation_id).catch(console.error);
          }
        });

        socket.on('message_edited', (message: Message) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === message.id ? message : m))
          );
        });

        socket.on('message_deleted', ({ messageId }: { messageId: string }) => {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        });

        socket.on('conversation_updated', () => {
          loadConversations();
        });

        socket.on('user_typing', ({ userId, userName }: any) => {
          if (userId !== user.id) {
            setTypingUsers((prev) => new Set(prev).add(userName));
          }
        });

        socket.on('user_stop_typing', () => {
          setTypingUsers(new Set());
        });

      } catch (err) {
        console.error('Failed to setup socket:', err);
      }
    };

    setupSocket();

    return () => {
      if (socketRef.current) {
        if (selectedConversation) {
          socketRef.current.emit('leave_conversation', selectedConversation);
        }
        disconnectBackendSocket();
        socketRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user?.id]);

  // Join/leave conversation
  useEffect(() => {
    if (!socketRef.current) return;

    if (selectedConversation) {
      console.log('Joining conversation:', selectedConversation);
      socketRef.current.emit('join_conversation', selectedConversation);
      loadMessages(selectedConversation);

      return () => {
        if (socketRef.current && selectedConversation) {
          socketRef.current.emit('leave_conversation', selectedConversation);
        }
      };
    }
  }, [selectedConversation, loadMessages]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participants?.some((p) =>
      `${p.user?.first_name} ${p.user?.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
  );

  // Get current conversation
  const currentConversation = conversations.find((c) => c.id === selectedConversation);

  // Get conversation display
  const getConversationDisplay = (conv: Conversation) => {
    if (conv.name) {
      return {
        name: conv.name,
        avatar: conv.name.substring(0, 2).toUpperCase(),
        role: conv.type === 'group' ? 'Group Chat' : conv.type === 'internship' ? 'Internship Chat' : 'Direct Message',
      };
    }

    const otherParticipant = conv.participants?.find((p) => p.user_id !== user?.id);
    if (otherParticipant?.user) {
      const fullName = `${otherParticipant.user.first_name} ${otherParticipant.user.last_name}`;
      return {
        name: fullName,
        avatar: `${otherParticipant.user.first_name[0]}${otherParticipant.user.last_name[0]}`,
        role: otherParticipant.user.role || 'User',
      };
    }

    return { name: 'Unknown', avatar: '??', role: 'Unknown' };
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle conversation created
  const handleConversationCreated = async (conversationId: string) => {
    await loadConversations();
    setSelectedConversation(conversationId);
    await loadMessages(conversationId);
  };

  // Edit message handlers
  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      await messagesAPI.editMessage(messageId, editContent);
      setEditingMessageId(null);
      setEditContent('');
    } catch (err: any) {
      console.error('Failed to edit message:', err);
      setError(err.message || 'Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await messagesAPI.deleteMessage(messageId);
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      setError(err.message || 'Failed to delete message');
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent, messageId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(messageId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <AdvisorSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdvisorHeader />
          
          <div className="flex-1 flex flex-col overflow-hidden p-8 xl:p-12 bg-gray-50">
            <div className="mb-8 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Messages</h1>
                  <p className="text-gray-600 mt-2 text-lg">Communicate with your students and colleagues</p>
                </div>
                {socketConnected && (
                  <div className="flex items-center gap-2 text-base text-[#4CAF50]">
                    <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse" />
                    <span>Connected</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
              {/* Conversations List */}
              <Card className="md:col-span-1 flex flex-col overflow-hidden bg-white border border-gray-200">
                <CardHeader className="flex-shrink-0 border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-gray-900">
                      Conversations ({conversations.length})
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setShowNewMessageModal(true)}
                      className="gap-2 bg-[#4CAF50] hover:bg-[#45a049] text-white"
                    >
                      <PenSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">New</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden pb-4 pt-4">
                  <div className="relative flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 text-base border-gray-300"
                    />
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">Loading...</div>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">
                        {searchQuery ? 'No conversations found' : 'No conversations yet'}
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1">
                      <div className="space-y-2 pr-4">
                        {filteredConversations.map((conv) => {
                          const display = getConversationDisplay(conv);
                          
                          return (
                            <button
                              key={conv.id}
                              onClick={() => setSelectedConversation(conv.id)}
                              className={`w-full text-left p-4 rounded-lg transition-colors ${
                                selectedConversation === conv.id
                                  ? 'bg-[#4CAF50]/10 border-2 border-[#4CAF50]'
                                  : 'hover:bg-gray-50 border-2 border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarFallback className="bg-[#4CAF50]/10 text-[#4CAF50] font-semibold text-base">
                                    {display.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-base text-gray-900">
                                    {display.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {display.role}
                                  </div>
                                </div>
                                {conv.last_message_at && (
                                  <div className="text-xs text-gray-500">
                                    {formatTime(conv.last_message_at)}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="md:col-span-2 flex flex-col overflow-hidden bg-white border border-gray-200">
                {currentConversation ? (
                  <>
                    <CardHeader className="border-b border-gray-200 flex-shrink-0 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {(() => {
                            const display = getConversationDisplay(currentConversation);
                            return (
                              <>
                                <Avatar className="w-14 h-14">
                                  <AvatarFallback className="bg-[#4CAF50]/10 text-[#4CAF50] font-semibold text-lg">
                                    {display.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold text-gray-900 text-lg">{display.name}</div>
                                  <div className="text-base text-gray-600">{display.role}</div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </CardHeader>

                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4 pr-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-2 max-w-xs ${msg.sender_id === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarFallback className={`text-xs font-semibold ${
                                  msg.sender_id === user?.id ? 'bg-[#4CAF50] text-white' : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {msg.sender_id === user?.id ? 'You' : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className={msg.sender_id === user?.id ? 'items-end' : 'items-start'}>
                                {editingMessageId === msg.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      onKeyDown={(e) => handleEditKeyPress(e, msg.id)}
                                      className="flex-1"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveEdit(msg.id)}
                                      className="bg-[#4CAF50] hover:bg-[#45a049]"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <div className={`px-4 py-2 rounded-lg ${
                                      msg.sender_id === user?.id
                                        ? 'bg-[#4CAF50] text-white rounded-br-none'
                                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                    }`}>
                                      <p>{msg.content}</p>
                                      {msg.file_url && (
                                        <div className="mt-2 flex items-center gap-2">
                                          {getFileIcon(msg.metadata?.mimeType || '')}
                                          <a
                                            href={msg.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline text-sm"
                                          >
                                            {msg.metadata?.originalName || 'Attachment'}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="text-xs text-gray-500">{formatTime(msg.created_at)}</div>
                                      {msg.sender_id === user?.id && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                              <span className="text-xs">⋮</span>
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleStartEdit(msg)}>
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
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    <div className="border-t p-4 flex-shrink-0">
                      {selectedFile && (
                        <div className="mb-2 flex items-center gap-2 p-2 bg-gray-50 rounded">
                          {filePreview ? (
                            <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded" />
                          ) : (
                            getFileIcon(selectedFile.type)
                          )}
                          <span className="text-sm flex-1">{selectedFile.name}</span>
                          <span className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</span>
                          <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
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
                          accept="image/*,.pdf,.doc,.docx,.zip"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Input
                          placeholder="Type a message..."
                          value={messageInput}
                          onChange={(e) => {
                            setMessageInput(e.target.value);
                            handleTyping();
                          }}
                          onKeyPress={handleKeyPress}
                          className="flex-1 h-11 text-base border-gray-300"
                          disabled={sending}
                        />
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          >
                            <Smile className="w-5 h-5" />
                          </Button>
                          {showEmojiPicker && (
                            <div className="absolute bottom-12 right-0 z-50 emoji-picker-container">
                              <EmojiPicker onEmojiClick={handleEmojiClick} />
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={handleSendMessage}
                          disabled={sending || (!messageInput.trim() && !selectedFile)}
                          className="bg-[#4CAF50] hover:bg-[#45a049] text-white px-6"
                        >
                          <Send className="w-5 h-5" />
                        </Button>
                      </div>
                      {typingUsers.size > 0 && (
                        <div className="text-sm text-gray-500 mt-2">
                          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-400 text-lg">Select a conversation to start messaging</div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {!selectedConversation ? (
          <>
            <MobileHeader 
              title="Messages"
              subtitle="Communicate with students and colleagues"
            />
            <div className="flex-1 overflow-y-auto p-4 pb-20">
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />
              <div className="space-y-2">
                {filteredConversations.map((conv) => {
                  const display = getConversationDisplay(conv);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className="w-full text-left p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-[#4CAF50]/10 text-[#4CAF50] font-semibold text-sm">
                            {display.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{display.name}</div>
                          <div className="text-xs text-gray-600">{display.role}</div>
                          {conv.last_message_at && (
                            <div className="text-xs text-gray-500">{formatTime(conv.last_message_at)}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="border-b p-3 bg-white flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setSelectedConversation('')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {currentConversation && (() => {
                const display = getConversationDisplay(currentConversation);
                return (
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-[#4CAF50]/10 text-[#4CAF50] font-semibold text-xs">
                        {display.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">{display.name}</div>
                      <div className="text-xs text-gray-600">{display.role}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[85%] ${msg.sender_id === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        msg.sender_id === user?.id
                          ? 'bg-[#4CAF50] text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t p-3 bg-white">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  className="h-8 bg-[#4CAF50] hover:bg-[#45a049]"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
        <BottomNavigation type="advisor" />
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
          <DialogContent className="max-w-2xl">
            <NewMessageModal
              isOpen={showNewMessageModal}
              onClose={() => setShowNewMessageModal(false)}
              onConversationCreated={handleConversationCreated}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

