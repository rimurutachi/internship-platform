'use client';

import { useState } from 'react';
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile, ArrowLeft } from 'lucide-react';
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

interface Message {
  id: string;
  sender: string;
  senderRole: string;
  avatar: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

interface Conversation {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'Company Supervisor',
    avatar: 'JD',
    lastMessage: 'Great work on the project! Keep it up.',
    lastMessageTime: '2 hours ago',
    unread: 2
  },
  {
    id: '2',
    name: 'Dr. Jane Smith',
    role: 'University Advisor',
    avatar: 'JS',
    lastMessage: 'Remember to submit your weekly report by Friday',
    lastMessageTime: '4 hours ago',
    unread: 0
  },
  {
    id: '3',
    name: 'HR Department',
    role: 'Company',
    avatar: 'HR',
    lastMessage: 'Your onboarding documents are ready',
    lastMessageTime: '1 day ago',
    unread: 0
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'John Doe',
    senderRole: 'Company Supervisor',
    avatar: 'JD',
    content: 'Hi! How are you progressing with the project?',
    timestamp: '10:30 AM',
    isOwn: false
  },
  {
    id: '2',
    sender: 'You',
    senderRole: 'Student',
    avatar: 'SU',
    content: 'Hi John! The project is going well. I\'ve completed the initial design phase.',
    timestamp: '10:35 AM',
    isOwn: true
  },
  {
    id: '3',
    sender: 'John Doe',
    senderRole: 'Company Supervisor',
    avatar: 'JD',
    content: 'That\'s excellent! Can you share the design mockups?',
    timestamp: '10:40 AM',
    isOwn: false
  },
  {
    id: '4',
    sender: 'You',
    senderRole: 'Student',
    avatar: 'SU',
    content: 'Of course! I\'ve uploaded them to the shared drive. Let me know your thoughts.',
    timestamp: '10:45 AM',
    isOwn: true
  },
  {
    id: '5',
    sender: 'John Doe',
    senderRole: 'Company Supervisor',
    avatar: 'JD',
    content: 'Great work on the project! Keep it up.',
    timestamp: '11:00 AM',
    isOwn: false
  }
];

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<string>('1');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const currentConversation = mockConversations.find(c => c.id === selectedConversation);

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
          
          {/* Page Content - Fixed Header, Scrollable Chat Areas */}
          <div className="flex-1 flex flex-col overflow-hidden p-6">
            {/* Fixed Page Header */}
            <div className="mb-6 flex-shrink-0">
              <h1 className="text-3xl font-bold text-foreground">Messages</h1>
              <p className="text-muted-foreground mt-1">Chat with supervisors and advisors</p>
            </div>

            {/* Scrollable Chat Layout */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
              {/* Conversations List - Scrollable */}
              <Card className="md:col-span-1 flex flex-col overflow-hidden">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-lg">Conversations</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-3 overflow-hidden pb-4">
                  <div className="relative flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="space-y-2 pr-4">
                {mockConversations.map((conv) => (
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
                          {conv.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-foreground">{conv.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{conv.lastMessage}</div>
                      </div>
                      {conv.unread > 0 && (
                        <Badge variant="default">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Area - Scrollable */}
              <Card className="md:col-span-2 flex flex-col overflow-hidden">
                {currentConversation && (
                  <>
                    {/* Fixed Chat Header */}
                    <CardHeader className="border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {currentConversation.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground">{currentConversation.name}</div>
                      <div className="text-sm text-muted-foreground">{currentConversation.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                    </CardHeader>

                    {/* Scrollable Messages Area */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4 pr-4">
                  {mockMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-xs ${msg.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className={`text-xs font-semibold ${
                            msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {msg.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className={msg.isOwn ? 'items-end' : 'items-start'}>
                          <div className={`px-4 py-2 rounded-lg ${
                            msg.isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-none'
                              : 'bg-muted text-foreground rounded-bl-none'
                          }`}>
                            {msg.content}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{msg.timestamp}</div>
                        </div>
                      </div>
                    </div>
                      ))}
                      </div>
                    </ScrollArea>

                    {/* Fixed Input Area */}
                    <div className="border-t p-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="sm">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button size="sm">
                    <Send className="w-4 h-4" />
                  </Button>
                    </div>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {!currentConversation ? (
          <>
            <MobileHeader 
              title="Messages"
              subtitle="Chat with supervisors and advisors"
            />
            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />
              <div className="space-y-2">
                {mockConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className="w-full text-left p-3 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">{conv.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-foreground">{conv.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{conv.lastMessage}</div>
                      </div>
                      {conv.unread > 0 && (
                        <Badge variant="default" className="text-xs">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
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
                  <span className="text-primary font-semibold text-xs">{currentConversation.avatar}</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{currentConversation.name}</div>
                  <div className="text-xs text-muted-foreground">{currentConversation.role}</div>
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
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[85%] ${msg.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {msg.avatar}
                      </div>
                      <div className={msg.isOwn ? 'items-end' : 'items-start'}>
                        <div className={`px-3 py-2 rounded-lg text-sm ${
                          msg.isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-muted text-foreground rounded-bl-none'
                        }`}>
                          {msg.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 px-1">{msg.timestamp}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button size="sm" className="h-8">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
        <BottomNavigation type="student" />
      </div>
    </div>
  );
}

