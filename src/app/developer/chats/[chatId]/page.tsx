'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { getChats, getMessages, sendMessage as sendMessageService, type Chat, type Message } from '@/services/whatsappService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Define message type for the UI
interface UIMessage {
  id: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
}

export default function DeveloperChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const chatId = params?.chatId as string;
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  
  // Redirect if not authenticated or not a developer
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'developer') {
      router.push('/admin/dashboard');
    }
  }, [status, session, router]);

  // Get chat details
  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => getChats(),
    enabled: !!session && session?.user?.role === 'developer',
  });

  // Find the current chat
  const chat = useMemo(() => {
    if (!chatsData?.chats) return null;
    return chatsData.chats.find((c: Chat) => c.id.user === chatId);
  }, [chatsData, chatId]);

  // Get messages
  const { 
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['messages', 'default', chatId],
    queryFn: async () => getMessages('default', chatId),
    enabled: !!chatId && !!session && session?.user?.role === 'developer',
  });

  // Transform messages for UI
  const messages: UIMessage[] = useMemo(() => {
    if (!messagesData?.messages) return [];
    return messagesData.messages.map((message: Message) => ({
      id: message.id,
      body: message.body,
      timestamp: message.timestamp,
      fromMe: message.from === 'me'
    }));
  }, [messagesData]);

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

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;
    
    try {
      sendMessageMutation.mutate({
        sessionId: 'default', // Using default session for developer
        chatId,
        message: newMessage
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }, [chatId, newMessage, sendMessageMutation]);

  // Handle keypress (Enter to send)
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

  if (status === 'loading' || chatsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="flex items-center mb-6">
            <Button variant="outline" asChild className="mr-4">
              <Link href="/developer/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Chat Not Found</h2>
            <p className="text-gray-600">
              This chat doesn't exist or you don't have permission to access it.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Button variant="outline" asChild className="mr-4">
            <Link href="/developer/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Chat with {chat.name}</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[calc(100vh-200px)] flex flex-col">
          {/* Chat header */}
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-green-100 text-green-600">
                  {chat.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-medium text-gray-900">{chat.name}</h2>
                <p className="text-sm text-gray-600">
                  {chat.name.includes('@g.us') ? 'Group' : 'Contact'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-green-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>No messages yet</p>
              </div>
            ) : (
              messages.map(message => (
                <div 
                  key={message.id}
                  className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.fromMe
                        ? 'bg-green-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.body}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.fromMe ? 'text-green-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Message input */}
          <div className="border-t border-gray-200 p-4 flex items-center gap-2">
            <Input
              className="flex-1"
              placeholder="Type a message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 