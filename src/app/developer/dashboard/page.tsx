'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navbar from '@/components/Navbar';
import {
  getMessages,
  sendMessage as sendMessageService,
  Chat,
  Message,
  MessageData
} from '@/services/whatsappService';
import { getDeveloperAssignedChats } from '@/services/developerService';
import {
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  User,
  Users,
  Clock,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Phone,
  Video,
  Check,
  CheckCheck
} from 'lucide-react';

interface UIMessage {
  id: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
}

interface AssignedChat {
  // Assignment details
  assignmentId: string;
  chatId: string;
  chatName: string;
  sessionId: string;
  assignedAt: string;

  // WhatsApp chat details
  id: any;
  name: string;
  isGroup: boolean;
  lastMessage?: any;

  // Session details
  sessionName: string;

  // Additional metadata
  isActive: boolean;
  unreadCount?: number;
  error?: string;
}

export default function DeveloperDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<AssignedChat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Redirect if not logged in or not a developer
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/developer/login?redirected=true');
    } else if (status === 'authenticated' && session?.user?.role !== 'developer') {
      router.push('/admin/dashboard');
    }
  }, [status, session, router]);

  // Get developer's assigned chats directly from database with WhatsApp details
  const {
    data: chatsData,
    isLoading: chatsLoading,
    refetch: refetchChats
  } = useQuery({
    queryKey: ['developerAssignedChats'],
    queryFn: async () => {
      const response = await getDeveloperAssignedChats();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch assigned chats');
      }
      return response.chats || [];
    },
    enabled: status === 'authenticated' && session?.user?.role === 'developer',
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  // Get messages for selected chat
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['messages', selectedChat?.sessionId, selectedChat?.chatId],
    queryFn: async () => {
      if (!selectedChat) return { messages: [] };
      const response = await getMessages(selectedChat.sessionId, selectedChat.chatId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch messages');
      }
      return response;
    },
    enabled: !!selectedChat,
    refetchInterval: 5000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: sendMessageService,
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
      toast.success('Message sent');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    }
  });

  // Transform messages for UI
  const messages: UIMessage[] = useMemo(() => {
    if (!messagesData?.messages) return [];
    return messagesData.messages
      .map((message: any) => ({ // Use any to access potential fromMe property
        id: message.id,
        body: message.body,
        timestamp: message.timestamp,
        fromMe: message.fromMe === true || message.from === 'me'
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp to ensure latest at bottom
  }, [messagesData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Filter chats based on search
  const filteredChats = useMemo(() => {
    if (!chatsData) return [];
    return chatsData.filter((chat: any) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chatsData, searchQuery]);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageData: MessageData = {
      sessionId: selectedChat.sessionId,
      chatId: selectedChat.chatId,
      text: newMessage
    };

    sendMessageMutation.mutate(messageData);
  }, [selectedChat, newMessage, sendMessageMutation]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Format timestamp
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }, []);

  // Format chat time for sidebar
  const formatChatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetchChats();
    if (selectedChat) {
      refetchMessages();
    }
    toast.success('Data refreshed');
  }, [refetchChats, refetchMessages, selectedChat]);

  if (status === 'loading' || chatsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f0f2f5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00a884]" />
      </div>
    );
  }

  if (status !== 'authenticated' || session?.user?.role !== 'developer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />

      <div className="h-[calc(100vh-64px)] flex">
        {/* Chat List Sidebar */}
        <div className="w-[400px] bg-white border-r border-[#e9edef] flex flex-col">
          {/* Header */}
          <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 border-b border-[#e9edef]">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#00a884] text-white">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'D'}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-[#41525d] font-medium">Chats</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={chatsLoading}
                className="text-[#54656f] hover:bg-[#f5f6f6] h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${chatsLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#54656f] hover:bg-[#f5f6f6] h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-[#e9edef]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
              <Input
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-[#f0f2f5] border-none text-[#3b4a54] placeholder-[#8696a0] focus:bg-white focus:ring-1 focus:ring-[#00a884]"
              />
            </div>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            {chatsLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center text-[#8696a0]">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[#d1d7db]" />
                <h3 className="font-medium mb-2 text-[#3b4a54]">No Assigned Chats</h3>
                <p className="text-sm">
                  {searchQuery
                    ? 'No assigned chats match your search.'
                    : 'No chats have been assigned to you yet.'}
                </p>
              </div>
            ) : (
              <div>
                {filteredChats.map((chat: any) => (
                  <div
                    key={`${chat.sessionId}-${chat.chatId}`}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-[#e9edef] hover:bg-[#f5f6f6] ${selectedChat?.chatId === chat.chatId ? 'bg-[#e7f3f0]' : ''
                      }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-[#d9fdd3] text-[#3b4a54] text-lg">
                          {chat.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {!chat.isActive && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[#111b21] truncate">{chat.name}</h3>
                          {chat.isGroup && <Users className="h-4 w-4 text-[#8696a0]" />}
                        </div>
                        {chat.lastMessage && (
                          <span className="text-xs text-[#8696a0]">
                            {formatChatTime(chat.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-[#8696a0] truncate">
                          {chat.lastMessage ? chat.lastMessage.body : 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-1">
                          {chat.unreadCount && chat.unreadCount > 0 && (
                            <div className="bg-[#00a884] text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                            </div>
                          )}
                          {chat.error && (
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 border-b border-[#e9edef]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[#d9fdd3] text-[#3b4a54]">
                      {selectedChat.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium text-[#111b21]">{selectedChat.name}</h2>
                    <div className="flex items-center gap-2 text-xs text-[#8696a0]">
                      <span>{selectedChat.sessionName}</span>
                      <span>•</span>
                      <span>{selectedChat.isGroup ? 'Group' : 'Contact'}</span>
                      {selectedChat.isActive ? (
                        <span className="text-[#00a884]">• Online</span>
                      ) : (
                        <span className="text-red-400">• Offline</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#54656f] hover:bg-[#f5f6f6] h-8 w-8 p-0"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#54656f] hover:bg-[#f5f6f6] h-8 w-8 p-0"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#54656f] hover:bg-[#f5f6f6] h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div
                className="flex-1 overflow-y-auto px-4 py-2"
              >

                {messagesLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-[#8696a0] mt-8">
                    <div className="bg-white rounded-lg p-6 mx-auto max-w-md shadow-sm">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[#d1d7db]" />
                      <p className="text-[#3b4a54] font-medium mb-1">No messages here yet...</p>
                      <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 py-4">
                    {messages.map((message, index) => {
                      const showTime = index === 0 ||
                        messages[index - 1].timestamp < message.timestamp - 300; // 5 minutes gap

                      return (
                        <div key={message.id}>
                          {showTime && (
                            <div className="flex justify-center my-4">
                              <div className="bg-white text-[#8696a0] text-xs px-3 py-1 rounded-lg shadow-sm">
                                {formatTime(message.timestamp)}
                              </div>
                            </div>
                          )}
                          <div className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'} mb-1`}>
                            <div
                              className={`max-w-[65%] px-3 py-2 rounded-lg relative shadow-sm ${message.fromMe
                                ? 'bg-[#d9fdd3] text-[#111b21]'
                                : 'bg-white text-[#111b21]'
                                }`}
                              style={{
                                borderRadius: message.fromMe
                                  ? '7.5px 7.5px 7.5px 7.5px'
                                  : '7.5px 7.5px 7.5px 7.5px'
                              }}
                            >
                              <p className="text-sm leading-relaxed break-words">{message.body}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${message.fromMe ? 'text-[#667781]' : 'text-[#8696a0]'
                                }`}>
                                <span>{formatTime(message.timestamp)}</span>
                                {message.fromMe && (
                                  <CheckCheck className="h-3 w-3 text-[#4fc3f7]" />
                                )}
                              </div>

                              {/* Message tail */}
                              <div
                                className={`absolute top-0 w-0 h-0 ${message.fromMe
                                  ? 'right-[-8px] border-l-[8px] border-l-[#d9fdd3] border-t-[8px] border-t-transparent'
                                  : 'left-[-8px] border-r-[8px] border-r-white border-t-[8px] border-t-transparent'
                                  }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Invisible div to scroll to */}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-[#f0f2f5] border-t border-[#e9edef] p-3">
                <div className="flex items-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#8696a0] hover:bg-[#f5f6f6] h-10 w-10 p-0 rounded-full"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#8696a0] hover:bg-[#f5f6f6] h-10 w-10 p-0 rounded-full"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>

                  <div className="flex-1 relative">
                    <Input
                      className="w-full bg-white border border-[#e9edef] text-[#3b4a54] placeholder-[#8696a0] pr-12 py-2 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#00a884] focus:border-[#00a884]"
                      placeholder="Type a message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={sendMessageMutation.isPending}
                    />
                  </div>

                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="h-10 w-10 p-0 rounded-full bg-[#00a884] hover:bg-[#008f72] disabled:bg-[#d1d7db]"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex items-center justify-center"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.04' fill-rule='evenodd'%3E%3Cpath d='m0 40l40-40h-40v40z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: '#e5ddd5'
              }}
            >
              <div className="text-center text-[#8696a0] max-w-md">
                <div className="bg-white rounded-lg p-8 shadow-sm">
                  <MessageSquare className="h-20 w-20 mx-auto mb-6 text-[#d1d7db]" />
                  <h3 className="text-xl font-light text-[#3b4a54] mb-2">WhatsApp Developer</h3>
                  <p className="text-sm leading-relaxed">
                    Send and receive messages without keeping your phone online.<br />
                    Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                  </p>
                  <div className="mt-6 text-xs text-[#8696a0]">
                    Select a chat to start messaging
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 