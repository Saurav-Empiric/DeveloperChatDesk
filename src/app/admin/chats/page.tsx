'use client';

import Navbar from '@/components/Navbar';
import {
  getChats,
  getMessages,
  getSessions,
  sendMessage as sendMessageService,
  type MessageData,
  type Chat as ServiceChat,
  type Message as ServiceMessage
} from '@/services/whatsappService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Import chat components
import {
  ChatHeader,
  ChatSidebar,
  ErrorMessage,
  LoadingSpinner,
  MessageInput,
  MessagesArea,
  NoChatSelectedState,
  NoSessionsState,
  SessionSelector,
  type Chat,
  type Message
} from '@/components/admin/chat';

// Helper function to transform service chat to UI chat
const transformChat = (serviceChat: ServiceChat): Chat => ({
  id: serviceChat.id,
  name: serviceChat.name,
  lastMessage: {
    text: serviceChat.lastMessage?.body || '',
    timestamp: serviceChat.lastMessage?.timestamp || 0,
    fromMe: false // This would need to be determined based on session info
  },
  unreadCount: 0, // This would come from the API if available
  isGroup: serviceChat.name.includes('@g.us') || serviceChat.name.includes('group'),
  isAssigned: false // This would be determined by checking assignments
});

// Helper function to transform service message to UI message
const transformMessage = (serviceMessage: ServiceMessage): Message => ({
  id: serviceMessage.id,
  body: serviceMessage.body,
  from: serviceMessage.from,
  to: serviceMessage.to,
  timestamp: serviceMessage.timestamp,
  type: serviceMessage.type,
  text: serviceMessage.body,
  fromMe: serviceMessage.type === 'outgoing' || false // This logic might need adjustment
});

export default function AdminChats() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Query Keys
  const QUERY_KEYS = {
    SESSIONS: ['whatsapp', 'sessions'],
    CHATS: (sessionId?: string) => ['whatsapp', 'chats', sessionId],
    MESSAGES: (sessionId: string, chatId: string) => ['whatsapp', 'messages', sessionId, chatId],
  } as const;

  // React Query for WhatsApp sessions
  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: QUERY_KEYS.SESSIONS,
    queryFn: async () => {
      const response = await getSessions();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch sessions');
      }
      return response.sessions || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // React Query for WhatsApp chats
  const {
    data: rawChats = [],
    isLoading: chatsLoading,
    error: chatsError,
    refetch: refetchChats
  } = useQuery({
    queryKey: QUERY_KEYS.CHATS(selectedSession),
    queryFn: async () => {
      if (!selectedSession) return [];
      const response = await getChats(selectedSession);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch chats');
      }
      return response.chats || [];
    },
    enabled: !!selectedSession,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // React Query for WhatsApp messages
  const {
    data: rawMessages = [],
    isLoading: messagesLoading,
    error: messagesError
  } = useQuery({
    queryKey: QUERY_KEYS.MESSAGES(selectedSession, selectedChat?.id?.user || ''),
    queryFn: async () => {
      if (!selectedSession || !selectedChat?.id?.user) return [];
      const response = await getMessages(selectedSession, selectedChat.id.user);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch messages');
      }
      return response.messages || [];
    },
    enabled: !!selectedSession && !!selectedChat?.id?.user,
    staleTime: 30 * 1000, // 30 seconds
  });

  // React Query mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageData) => {
      const response = await sendMessageService(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to send message');
      }
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch messages for the specific chat
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MESSAGES(variables.sessionId, variables.chatId)
      });

      // Optionally update chats list to reflect the new last message
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CHATS(variables.sessionId)
      });
    },
  });

  // Transform data
  const chats = useMemo(() => rawChats.map(transformChat), [rawChats]);
  const messages = useMemo(() => rawMessages.map(transformMessage), [rawMessages]);

  // Auto-select first session when sessions are loaded
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0].id);
    }
  }, [sessions, selectedSession]);

  // Utility function to format time
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  // Handle chat selection
  const handleChatSelect = useCallback((chat: Chat) => {
    setSelectedChat(chat);
  }, []);

  // Handle message sending
  const handleSendMessage = useCallback(async () => {
    if (!selectedChat || !newMessage.trim() || !selectedSession) return;

    try {
      await sendMessageMutation.mutateAsync({
        sessionId: selectedSession,
        chatId: selectedChat.id.user,
        message: newMessage
      });
      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      toast.error('Failed to send message');
    }
  }, [selectedChat, newMessage, selectedSession, sendMessageMutation]);

  // Handle key press for message input
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Authentication and role checks
  if (status === 'loading' || sessionsLoading) {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (session?.user?.role !== 'admin') {
    router.push('/developer/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto py-4 h-[calc(100vh-80px)]">
        {/* Session Selection Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">WhatsApp Chats</h1>
          <SessionSelector
            sessions={sessions}
            selectedSession={selectedSession}
            onSessionChange={setSelectedSession}
          />
        </div>

        {/* Error Messages */}
        {sessionsError && (
          <ErrorMessage
            message="Failed to load WhatsApp sessions"
            onRetry={() => refetchSessions()}
          />
        )}

        {chatsError && (
          <ErrorMessage
            message="Failed to load chats"
            onRetry={() => refetchChats()}
          />
        )}

        {sessions.length === 0 && !sessionsLoading ? (
          <NoSessionsState />
        ) : (
          <div className="flex bg-white rounded-lg shadow-lg h-[calc(100vh-200px)]">
            {/* Chat List Sidebar */}
            <ChatSidebar
              chats={chats}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedChat={selectedChat}
              onChatSelect={handleChatSelect}
              formatTime={formatTime}
              isLoading={chatsLoading}
            />

            {/* Chat Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  <ChatHeader selectedChat={selectedChat} />
                  <MessagesArea
                    messages={messages}
                    isLoading={messagesLoading}
                    isError={!!messagesError}
                    formatTime={formatTime}
                  />
                  <MessageInput
                    message={newMessage}
                    onMessageChange={setNewMessage}
                    onSendMessage={handleSendMessage}
                    onKeyPress={handleKeyPress}
                    isLoading={sendMessageMutation.isPending}
                  />
                </>
              ) : (
                <NoChatSelectedState />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
