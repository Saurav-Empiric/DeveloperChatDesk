'use client';

import { MessageInput } from '@/components/chats/MessageInput';
import { MessagesArea } from '@/components/chats/MessagesArea';
import { DeveloperChatHeader } from '@/components/developer/ChatHeader';
import { DeveloperChatSidebar } from '@/components/developer/ChatSidebar';
import { getDeveloperAssignedChats } from '@/services/developerService';
import {
  getMessages,
  sendMessage as sendMessageService,
} from '@/services/whatsappService';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import {
  Loader2,
  MessageSquare
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function DeveloperDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    fetchNextPage: fetchNextMessages,
    hasNextPage: hasMoreMessages,
    isFetchingNextPage: isFetchingNextMessages,
    refetch: refetchMessages
  } = useInfiniteQuery({
    queryKey: ['messages', selectedChat?.sessionId, selectedChat?.id?._serialized],
    queryFn: async ({ pageParam = 0 }) => {
      if (!selectedChat) return { messages: [] };
      const response = await getMessages(selectedChat.sessionId, selectedChat.id?._serialized, 20, pageParam);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch messages');
      }
      return {
        messages: response.messages || [],
        pagination: response.pagination || { limit: 20, offset: pageParam, hasMore: false }
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) return undefined;
      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
    enabled: !!selectedChat,
  });

  // Flatten and transform messages for UI
  const messages = useMemo(() => {
    if (!messagesData) return [];
    return (messagesData.pages as any[])
      .flatMap((page: any) => page.messages || [])
      .map((message: any) => ({
        id: message.id,
        body: message.body,
        timestamp: message.timestamp,
        fromMe: message.fromMe === true || message.from === 'me',
        from: message.from || '',
        to: message.to || '',
        type: message.type || 'chat',
        text: message.body || '',
        isFromMe: message.fromMe === true || message.from === 'me'
      }))
      .sort((a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp);
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

    const messageData: any = { // Assuming MessageData is not directly imported, using 'any' for now
      sessionId: selectedChat.sessionId,
      // Use serialized ID if available, otherwise fall back to chatId
      chatId: selectedChat.id?._serialized || selectedChat.chatId,
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


  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetchChats();
    if (selectedChat) {
      refetchMessages();
    }
    toast.success('Data refreshed');
  }, [refetchChats, refetchMessages, selectedChat]);

  // Redirect if not logged in or not a developer
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/developer/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'developer') {
      router.push('/admin/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading' || chatsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f0f2f5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00a884]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      <div className="h-[calc(100vh-64px)] flex">
        {/* Chat List Sidebar */}
        <DeveloperChatSidebar
          session={session}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          chatsLoading={chatsLoading}
          filteredChats={filteredChats}
          handleRefresh={handleRefresh}
        />

        {/* Chat Messages Area */}
        <div className="hidden md:flex flex-1 flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <DeveloperChatHeader selectedChat={selectedChat} />

              {/* Messages Area */}
              <MessagesArea
                messages={messages}
                messagesLoading={messagesLoading}
                hasMore={hasMoreMessages}
                isFetchingMore={isFetchingNextMessages}
                loadMore={fetchNextMessages}
              />

              {/* Message Input */}
              <MessageInput
                message={newMessage}
                onMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                onKeyPress={handleKeyPress}
                isLoading={sendMessageMutation.isPending}
              />
            </>
          ) : (
            <div
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center text-[#8696a0] max-w-md">
                <div className="bg-white rounded-lg p-8 shadow-sm">
                  <MessageSquare className="h-20 w-20 mx-auto mb-6 text-[#d1d7db]" />
                  <h3 className="text-xl font-light text-[#3b4a54] mb-2">WhatsApp Developer</h3>
                  <p className="text-sm leading-relaxed">
                    Send and receive messages<br />
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