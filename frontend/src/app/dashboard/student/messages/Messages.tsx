'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile, ArrowLeft, PenSquare, Edit, Trash2, Check, X, FileText, Image as ImageIcon, File, Download } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
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

      // Stop typing indicator
      if (socketRef.current) {
        socketRef.current.emit('stop_typing', { conversationId: selectedConversation });
      }

      await messagesAPI.sendMessage({
        conversation_id: selectedConversation,
        content: content || (file ? file.name : ''),
        message_type: file ? 'file' : 'text',
      }, file || undefined);

      // Message will be added via socket event
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message');
      setMessageInput(content); // Restore input on error
      if (file) setSelectedFile(file);
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Generate preview for images
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

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get file icon based on mime type
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

  // Handle emoji selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!socketRef.current || !selectedConversation || !user) return;

    // Emit typing event
    socketRef.current.emit('typing', {
      conversationId: selectedConversation,
      userName: `${user.first_name} ${user.last_name}`,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
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

        // Connection status
        socket.on('connect', () => {
          console.log('Socket connected for messages');
          setSocketConnected(true);
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
          setSocketConnected(false);
        });

        // Join user room for conversation updates
        socket.emit('join_user_room', user.id);

        // Listen for new messages
        socket.on('new_message', (message: Message) => {
          console.log('New message received:', message);
          setMessages((prev) => [...prev, message]);
          scrollToBottom();

          // Refresh conversation list to update last message preview
          loadConversations();

          // If message is in current conversation, mark as read
          if (message.conversation_id === selectedConversation) {
            messagesAPI.markAsRead(message.conversation_id).catch(console.error);
          }
        });

        // Listen for message edits
        socket.on('message_edited', (message: Message) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === message.id ? message : m))
          );
        });

        // Listen for message deletes
        socket.on('message_deleted', ({ messageId }: { messageId: string }) => {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        });

        // Listen for conversation updates
        socket.on('conversation_updated', (data: any) => {
          console.log('Conversation updated:', data);
          loadConversations(); // Refresh conversation list
        });

        // Typing indicators
        socket.on('user_typing', ({ userId, userName }: any) => {
          if (userId !== user.id) {
            setTypingUsers((prev) => new Set(prev).add(userName));
          }
        });

        socket.on('user_stop_typing', ({ userId }: any) => {
          if (userId !== user.id) {
            setTypingUsers((prev) => {
              const updated = new Set(prev);
              // Remove any user (simplified - would need userName to be exact)
              updated.clear();
              return updated;
            });
          }
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

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Join/leave conversation rooms
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

  // Get current conversation details
  const currentConversation = conversations.find((c) => c.id === selectedConversation);

  // Get conversation display name and avatar
  const getConversationDisplay = (conv: Conversation) => {
    if (conv.name) {
      return {
        name: conv.name,
        avatar: conv.name.substring(0, 2).toUpperCase(),
        role: conv.type === 'group' ? 'Group Chat' : conv.type === 'internship' ? 'Internship Chat' : 'Direct Message',
      };
    }

    // For direct messages, show other participant
    const otherParticipant = conv.participants?.find((p) => p.user_id !== user?.id);
    if (otherParticipant?.user) {
      const fullName = `${otherParticipant.user.first_name} ${otherParticipant.user.last_name}`;
      return {
        name: fullName,
        avatar: `${otherParticipant.user.first_name[0]}${otherParticipant.user.last_name[0]}`,
        role: otherParticipant.user.role || 'User',
      };
    }

    return {
      name: 'Unknown',
      avatar: '??',
      role: 'Unknown',
    };
  };

  // Handle key press for sending
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle new conversation created
  const handleConversationCreated = async (conversationId: string) => {
    // Reload conversations
    await loadConversations();
    // Select the new conversation
    setSelectedConversation(conversationId);
    // Load messages for the new conversation
    await loadMessages(conversationId);
  };

  // Start editing a message
  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  // Save edited message
  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      await messagesAPI.editMessage(messageId, editContent);
      setEditingMessageId(null);
      setEditContent('');
      // Message will update via socket event
    } catch (err: any) {
      console.error('Failed to edit message:', err);
      setError(err.message || 'Failed to edit message');
    }
  };

  // Delete a message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await messagesAPI.deleteMessage(messageId);
      // Message will be removed via socket event
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      setError(err.message || 'Failed to delete message');
    }
  };

  // Handle key press for editing
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
        {/* Left Sidebar */}
        <StudentSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <StudentHeader />
          
          {/* Page Content */}
          <div className="flex-1 flex flex-col overflow-hidden p-8 xl:p-12 bg-gray-50">
            {/* Fixed Page Header */}
            <div className="mb-8 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Messages</h1>
                  <p className="text-gray-600 mt-2 text-lg">Chat with supervisors and advisors</p>
                </div>
                {socketConnected && (
                  <div className="flex items-center gap-2 text-base text-[#4CAF50]">
                    <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse" />
                    <span>Connected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Chat Layout */}
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
                      <div className="text-sm text-muted-foreground">Loading conversations...</div>
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
                          const unreadCount = 0; // TODO: Calculate from last_read_at vs last_message_at
                          
                          return (
                            <button
                              key={conv.id}
                              onClick={() => setSelectedConversation(conv.id)}
                              className={`w-full text-left p-3 rounded-lg transition-colors ${
                                selectedConversation === conv.id
                                  ? 'bg-primary/10 border border-primary/20'
                                  : 'hover:bg-accent'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {display.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-foreground">
                                    {display.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {display.role}
                                  </div>
                                </div>
                                {unreadCount > 0 && (
                                  <Badge variant="default">{unreadCount}</Badge>
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
                {!selectedConversation ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="text-gray-600 text-lg mb-2">
                        Select a conversation to start messaging
                      </div>
                    </div>
                  </div>
                ) : currentConversation ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="border-b border-gray-200 flex-shrink-0 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-[#4CAF50]/10 text-[#4CAF50] font-semibold text-lg">
                              {getConversationDisplay(currentConversation).avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-gray-900 text-lg">
                              {getConversationDisplay(currentConversation).name}
                            </div>
                            <div className="text-base text-gray-600">
                              {getConversationDisplay(currentConversation).role}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" title="Voice Call (Coming Soon)" className="hover:bg-gray-100">
                            <Phone className="w-5 h-5 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Video Call (Coming Soon)" className="hover:bg-gray-100">
                            <Video className="w-5 h-5 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4 pr-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No messages yet. Start the conversation!
                          </div>
                        ) : (
                          messages.map((msg) => {
                            const isOwn = msg.sender_id === user?.id;
                            const senderName = isOwn
                              ? 'You'
                              : msg.sender
                              ? `${msg.sender.first_name} ${msg.sender.last_name}`
                              : 'Unknown';
                            const avatar = isOwn
                              ? user?.first_name && user?.last_name ? `${user.first_name[0]}${user.last_name[0]}` : 'YO'
                              : msg.sender
                              ? `${msg.sender.first_name[0]}${msg.sender.last_name[0]}`
                              : '??';

                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                              >
                                <div
                                  className={`flex gap-2 max-w-xs ${
                                    isOwn ? 'flex-row-reverse' : 'flex-row'
                                  }`}
                                >
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarFallback
                                      className={`text-xs font-semibold ${
                                        isOwn
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                    {/* Message Bubble or Edit Mode */}
                                    {editingMessageId === msg.id ? (
                                      // Edit Mode
                                      <div className="w-full max-w-xs">
                                        <textarea
                                          value={editContent}
                                          onChange={(e) => setEditContent(e.target.value)}
                                          onKeyDown={(e) => handleEditKeyPress(e, msg.id)}
                                          className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                          rows={3}
                                          autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                          >
                                            <X className="w-4 h-4 mr-1" />
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => handleSaveEdit(msg.id)}
                                            disabled={!editContent.trim()}
                                          >
                                            <Check className="w-4 h-4 mr-1" />
                                            Save
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      // Normal Message Display
                                      <div className="relative">
                                        <div
                                          className={`rounded-lg ${
                                            isOwn
                                              ? 'bg-primary text-primary-foreground rounded-br-none'
                                              : 'bg-muted text-foreground rounded-bl-none'
                                          }`}
                                        >
                                          {/* File Attachment */}
                                          {msg.message_type === 'file' && msg.file_url && (
                                            <div className="p-3">
                                              {msg.metadata?.mimeType?.startsWith('image/') ? (
                                                // Image preview
                                                <div className="mb-2">
                                                  <img 
                                                    src={msg.file_url} 
                                                    alt={msg.metadata?.originalName || 'Image'} 
                                                    className="max-w-xs rounded cursor-pointer hover:opacity-90"
                                                    onClick={() => window.open(msg.file_url, '_blank')}
                                                  />
                                                </div>
                                              ) : (
                                                // File card
                                                <div className="flex items-center gap-3 mb-2">
                                                  <div className={`p-2 rounded ${isOwn ? 'bg-primary-foreground/10' : 'bg-background'}`}>
                                                    {getFileIcon(msg.metadata?.mimeType || '')}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">
                                                      {msg.metadata?.originalName || msg.content}
                                                    </div>
                                                    {msg.metadata?.size && (
                                                      <div className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                        {formatFileSize(msg.metadata.size)}
                                                      </div>
                                                    )}
                                                  </div>
                                                  <a
                                                    href={msg.file_url}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`p-1.5 rounded hover:bg-opacity-80 ${isOwn ? 'hover:bg-primary-foreground/10' : 'hover:bg-background'}`}
                                                  >
                                                    <Download className="w-4 h-4" />
                                                  </a>
                                                </div>
                                              )}
                                              {/* Caption/Text content */}
                                              {msg.content && msg.content !== msg.metadata?.originalName && (
                                                <div className="text-sm">{msg.content}</div>
                                              )}
                                            </div>
                                          )}
                                          
                                          {/* Text Message */}
                                          {msg.message_type === 'text' && (
                                            <div className="px-4 py-2">{msg.content}</div>
                                          )}
                                        </div>
                                        
                                        {/* Dropdown Menu for Own Messages */}
                                        {isOwn && msg.message_type === 'text' && (
                                          <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-8' : 'right-0 translate-x-8'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                  <MoreVertical className="h-3 w-3" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align={isOwn ? 'start' : 'end'}>
                                                <DropdownMenuItem onClick={() => handleStartEdit(msg)}>
                                                  <Edit className="w-4 h-4 mr-2" />
                                                  Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  onClick={() => handleDeleteMessage(msg.id)}
                                                  className="text-destructive focus:text-destructive"
                                                >
                                                  <Trash2 className="w-4 h-4 mr-2" />
                                                  Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Timestamp */}
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {formatTime(msg.created_at)}
                                      {msg.is_edited && ' (edited)'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                      
                      {/* Typing Indicator */}
                      {typingUsers.size > 0 && (
                        <div className="text-sm text-muted-foreground italic mt-2">
                          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                        </div>
                      )}
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="border-t p-4 flex-shrink-0">
                      {/* File Preview */}
                      {selectedFile && (
                        <div className="mb-3 p-3 bg-muted rounded-lg flex items-center gap-3">
                          {filePreview ? (
                            <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                          ) : (
                            <div className="w-16 h-16 bg-background rounded flex items-center justify-center">
                              {getFileIcon(selectedFile.type)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{selectedFile.name}</div>
                            <div className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Input Row */}
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          title="Attach File"
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
                          disabled={sending}
                          className="flex-1"
                        />
                        
                        {/* Emoji Picker */}
                        <div className="relative emoji-picker-container">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title="Add Emoji"
                          >
                            <Smile className="w-4 h-4" />
                          </Button>
                          {showEmojiPicker && (
                            <div className="absolute bottom-12 right-0 z-50">
                              <EmojiPicker
                                onEmojiClick={handleEmojiClick}
                                width={350}
                                height={400}
                              />
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          size="sm" 
                          onClick={handleSendMessage} 
                          disabled={sending || (!messageInput.trim() && !selectedFile)}
                        >
                          {sending ? '...' : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Loading conversation...</div>
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
              subtitle="Chat with supervisors and advisors"
            />
            
            {/* Error Alert */}
            {error && (
              <div className="px-4 pt-4">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />
              
              {loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conv) => {
                    const display = getConversationDisplay(conv);
                    const unreadCount = 0;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className="w-full text-left p-3 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {display.avatar}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground">
                              {display.name}
                            </div>
                            <div className="text-xs text-muted-foreground">{display.role}</div>
                          </div>
                          {unreadCount > 0 && (
                            <Badge variant="default" className="text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : currentConversation ? (
          <>
            {/* Chat Header with Back Button */}
            <div className="border-b p-3 bg-card flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setSelectedConversation('')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-xs">
                    {getConversationDisplay(currentConversation).avatar}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {getConversationDisplay(currentConversation).name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getConversationDisplay(currentConversation).role}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Video className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    const avatar = isOwn
                      ? (user?.first_name && user?.last_name) ? `${user.first_name[0]}${user.last_name[0]}` : 'YO'
                      : msg.sender
                      ? `${msg.sender.first_name[0]}${msg.sender.last_name[0]}`
                      : '??';

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex gap-2 max-w-[85%] ${
                            isOwn ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {avatar}
                          </div>
                          <div className={isOwn ? 'items-end' : 'items-start'}>
                            <div
                              className={`px-3 py-2 rounded-lg text-sm ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground rounded-br-none'
                                  : 'bg-muted text-foreground rounded-bl-none'
                              }`}
                            >
                              {msg.content}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 px-1">
                              {formatTime(msg.created_at)}
                              {msg.is_edited && ' (edited)'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="text-xs text-muted-foreground italic mt-2">
                  {Array.from(typingUsers).join(', ')} typing...
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-3 bg-card">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                  disabled={sending}
                  className="flex-1 text-sm"
                />
                <Button 
                  size="sm" 
                  className="h-8"
                  onClick={handleSendMessage}
                  disabled={sending || !messageInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )}
        <BottomNavigation type="student" />
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}