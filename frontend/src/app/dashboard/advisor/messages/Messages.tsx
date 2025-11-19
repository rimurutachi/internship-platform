'use client';

import { useState } from 'react';
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile, ArrowLeft, Pin, Archive, Trash2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Message {
  id: string;
  sender: string;
  senderRole: string;
  avatar: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  attachments?: Array<{ name: string; size: string }>;
}

interface Conversation {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  status: 'online' | 'offline' | 'away';
  academicStatus?: string;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    role: 'Student',
    avatar: 'AJ',
    lastMessage: 'Thank you for the feedback on my evaluation!',
    lastMessageTime: '1 hour ago',
    unread: 0,
    status: 'online',
    academicStatus: 'Computer Science, Year 3'
  },
  {
    id: '2',
    name: 'Bob Martinez',
    role: 'Student',
    avatar: 'BM',
    lastMessage: 'Can we schedule a meeting to discuss my progress?',
    lastMessageTime: '3 hours ago',
    unread: 1,
    status: 'offline',
    academicStatus: 'Information Technology, Year 4'
  },
  {
    id: '3',
    name: 'Carol Chen',
    role: 'Student',
    avatar: 'CC',
    lastMessage: 'I received the internship offer!',
    lastMessageTime: '5 hours ago',
    unread: 2,
    status: 'online',
    academicStatus: 'Computer Science, Year 3'
  },
  {
    id: '4',
    name: 'David Lee',
    role: 'Student',
    avatar: 'DL',
    lastMessage: 'Submitting my mid-term report now',
    lastMessageTime: '1 day ago',
    unread: 0,
    status: 'away',
    academicStatus: 'Data Science, Year 3'
  },
  {
    id: '5',
    name: 'HR Department',
    role: 'Department',
    avatar: 'HR',
    lastMessage: 'Meeting scheduled for next Friday',
    lastMessageTime: '2 days ago',
    unread: 0,
    status: 'online',
    academicStatus: undefined
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'Alice Johnson',
    senderRole: 'Student',
    avatar: 'AJ',
    content: 'Hi Dr. Rodriguez, I wanted to ask about the evaluation criteria for our internship.',
    timestamp: '10:00 AM',
    isOwn: false
  },
  {
    id: '2',
    sender: 'You',
    senderRole: 'Advisor',
    avatar: 'AR',
    content: 'Hi Alice! Great question. The evaluation criteria includes technical skills (40%), communication (30%), work ethic (20%), and problem-solving (10%).',
    timestamp: '10:15 AM',
    isOwn: true
  },
  {
    id: '3',
    sender: 'Alice Johnson',
    senderRole: 'Student',
    avatar: 'AJ',
    content: 'That helps a lot. I\'ve been working on improving my technical skills through additional projects.',
    timestamp: '10:20 AM',
    isOwn: false
  },
  {
    id: '4',
    sender: 'You',
    senderRole: 'Advisor',
    avatar: 'AR',
    content: 'That\'s excellent initiative! Keep it up. I\'ve reviewed your mid-term evaluation and you\'re doing very well. Your supervisor has given you outstanding feedback.',
    timestamp: '10:25 AM',
    isOwn: true,
    attachments: [{ name: 'Mid_Term_Evaluation.pdf', size: '2.4 MB' }]
  },
  {
    id: '5',
    sender: 'Alice Johnson',
    senderRole: 'Student',
    avatar: 'AJ',
    content: 'Thank you for the feedback on my evaluation!',
    timestamp: '10:30 AM',
    isOwn: false
  }
];

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<string>('1');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const currentConversation = mockConversations.find(c => c.id === selectedConversation);
  const filteredConversations = mockConversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'away': return 'bg-warning';
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return '';
    }
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <AdvisorSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <AdvisorHeader />
          
          {/* Page Content - Fixed Header, Scrollable Chat Areas */}
          <div className="flex-1 flex flex-col overflow-hidden p-6">
            {/* Fixed Page Header */}
            <div className="mb-6 flex-shrink-0">
              <h1 className="text-3xl font-bold text-foreground">Messages</h1>
              <p className="text-muted-foreground mt-1">Communicate with your students and colleagues</p>
            </div>

            {/* Scrollable Chat Layout */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
              {/* Conversations List - Scrollable */}
              <Card className="md:col-span-1 flex flex-col overflow-hidden">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Conversations</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">+</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Start New Conversation</DialogTitle>
                          <DialogDescription>
                            Select a student or colleague to message
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          {mockConversations.map((conv) => (
                            <button
                              key={conv.id}
                              onClick={() => {
                                setSelectedConversation(conv.id);
                              }}
                              className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                            >
                              <div className="font-medium text-foreground">{conv.name}</div>
                              <div className="text-sm text-muted-foreground">{conv.role}</div>
                            </button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                      {filteredConversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv.id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedConversation === conv.id
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-accent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {conv.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(conv.status)}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-sm text-foreground">{conv.name}</div>
                                {conv.unread > 0 && (
                                  <Badge variant="default">
                                    {conv.unread}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{conv.lastMessage}</div>
                              <div className="text-xs text-muted-foreground mt-1">{conv.lastMessageTime}</div>
                            </div>
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
                          <div className="relative">
                            <Avatar>
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {currentConversation.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(currentConversation.status)}`}></div>
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{currentConversation.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {currentConversation.academicStatus || currentConversation.role}
                            </div>
                            <div className="text-xs text-muted-foreground">{getStatusText(currentConversation.status)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Video className="w-4 h-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Conversation Options</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start">
                                  <Pin className="w-4 h-4 mr-2" />
                                  Pin Conversation
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
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
                                  <p>{msg.content}</p>
                                  {msg.attachments && (
                                    <div className="mt-2 space-y-1">
                                      {msg.attachments.map((att, idx) => (
                                        <div key={idx} className={`flex items-center gap-2 text-xs ${
                                          msg.isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                        }`}>
                                          <Paperclip className="w-3 h-3" />
                                          <span>{att.name} ({att.size})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
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
                          onKeyPress={(e) => e.key === 'Enter' && setMessageInput('')}
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
        {!selectedConversation ? (
          <>
            <MobileHeader 
              title="Messages"
              subtitle="Communicate with students and colleagues"
              notificationCount={15}
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
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className="w-full text-left p-3 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">{conv.avatar}</span>
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(conv.status)}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-foreground">{conv.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{conv.lastMessage}</div>
                        <div className="text-xs text-muted-foreground mt-1">{conv.lastMessageTime}</div>
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
                <div className="relative">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-xs">{currentConversation?.avatar}</span>
                  </div>
                  {currentConversation && (
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${getStatusColor(currentConversation.status)}`}></div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{currentConversation?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {currentConversation?.academicStatus || currentConversation?.role}
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
                          {msg.attachments && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((att, idx) => (
                                <div key={idx} className={`flex items-center gap-1 text-xs ${
                                  msg.isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                }`}>
                                  <Paperclip className="w-3 h-3" />
                                  <span>{att.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
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
        <BottomNavigation type="advisor" />
      </div>
    </div>
  );
}

