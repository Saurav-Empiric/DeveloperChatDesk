'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { Phone, MessageSquare, Send, Search, Settings, MoreVertical, Loader2 } from 'lucide-react';

interface WhatsAppSession {
  id: string;
  name: string;
  status: string;
  me?: {
    id: string;
    name: string;
    number?: string;
  };
}

interface Chat {
  id: any;
  name: string;
  lastMessage: {
    text: string;
    timestamp: number;
    fromMe: boolean;
  };
  unreadCount: number;
  isGroup: boolean;
  isAssigned?: boolean;
  developerId?: string;
}

interface Message {
  id: string;
  body: string;
  text: string;
  timestamp: number;
  fromMe: boolean;
  sender?: {
    name: string;
    id: string;
  };
}

export default function AdminChats() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/developer/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchSessions();
    }
  }, [status, session]);

  useEffect(() => {
    if (selectedSession) {
      fetchChats(selectedSession);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/whatsapp/sessions');
      setSessions(response.data.sessions);

      if (response.data.sessions.length > 0) {
        setSelectedSession(response.data.sessions[0].id);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to fetch WhatsApp sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async (selectedSession: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/whatsapp/chats?sessionId=${selectedSession}`);
      setChats(response.data.chats ?? []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const response = await axios.get(`/api/whatsapp/messages?sessionId=${selectedSession}&chatId=${selectedChat.id.user}`);
      setMessages(response.data.messages ?? []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages');
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      await axios.post('/api/whatsapp/messages', {
        sessionId: selectedSession,
        chatId: selectedChat.id.user,
        text: newMessage
      });

      setNewMessage('');
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-10 h-10 md:w-16 md:h-16" />
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto py-4 h-[calc(100vh-80px)]">
        {/* Session Selection Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">WhatsApp Chats</h1>

          {sessions.length > 0 && (
            <div className="flex items-center gap-4">
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select WhatsApp Account" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{session.me?.name ?? session.name}</span>
                        <Badge variant={session.status === 'WORKING' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No WhatsApp Sessions Found</h3>
            <p className="text-gray-600 mb-4">
              No connected WhatsApp accounts found. Please connect your WhatsApp account in the WAHA dashboard first.
            </p>
            <Button onClick={() => window.open(process.env.WAHA_API_URL, '_blank')}>
              Open WAHA Dashboard
            </Button>
          </div>
        ) : (
          <div className="flex bg-white rounded-lg shadow-lg h-[calc(100vh-200px)]">
            {/* Chat List Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Chat List */}
              <ScrollArea className="flex-1">
                {filteredChats.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchQuery ? 'No chats found' : 'No chats available'}
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedChat?.id === chat.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {chat.name.charAt(0).toLocaleLowerCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 truncate">
                              {chat.name}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {formatTime(chat.lastMessage.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {chat.lastMessage.fromMe ? 'You: ' : ''}
                            {chat.lastMessage.text}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            {chat.unreadCount > 0 && (
                              <Badge variant="default" className="bg-green-500">
                                {chat.unreadCount}
                              </Badge>
                            )}
                            {chat.isAssigned && (
                              <Badge variant="secondary" className="text-xs">
                                Assigned
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {selectedChat.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="font-medium text-gray-900">{selectedChat.name}</h2>
                          <p className="text-sm text-gray-600">
                            {selectedChat.isGroup ? 'Group' : 'Contact'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedChat.isAssigned && (
                          <Badge variant="secondary">Assigned</Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <ScrollArea className="flex-1 p-4 bg-gray-50">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.fromMe
                              ? 'bg-green-500 text-white'
                              : 'bg-white text-gray-900 shadow-sm'
                              }`}
                          >
                            <p className="text-sm">{message.body}</p>
                            <p
                              className={`text-xs mt-1 ${message.fromMe ? 'text-green-100' : 'text-gray-500'
                                }`}
                            >
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            sendMessage();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Chat</h3>
                    <p className="text-gray-600">
                      Choose a conversation from the sidebar to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 