'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getAssignments,
  getChats,
  getMessages,
  getSessions,
  sendMessage as sendMessageService,
  unassignChat,
} from '@/services/whatsappService';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Import chat components
import {
  AssignChatDialog,
  AssignmentsView,
  ChatHeader,
  ChatSidebar,
  LoadingSpinner,
  MessageInput,
  MessagesArea,
  NoChatSelectedState,
  NoSessionsState,
  SessionSelector,
} from '@/components/admin/chat';
import { QUERY_KEYS } from '@/lib/constants';

// Extend the Chat type to include multiple developers
type ExtendedChat = any & {
  developers?: Array<{
    id: string;
    name: string;
    email: string;
    assignmentId: string;
  }>;
  assignedCount?: number;
};

// Helper function to transform service chat to UI chat
const transformChat = (serviceChat: any, assignments: any[] = []): ExtendedChat => {
  // Find all assignments for this chat
  const chatAssignments = assignments.filter(
    assignment => assignment.chatId === serviceChat.id.user
  );

  // Extract developer information with unique keys
  const developers = chatAssignments.map(assignment => ({
    id: assignment.developerId?._id?.toString() || '',
    name: assignment.developerId?.userId?.name || 'Unknown',
    email: assignment.developerId?.userId?.email || '',
    assignmentId: assignment._id, // Add unique assignment ID to ensure unique keys
  })).filter(dev => dev.id);

  return {
    id: serviceChat.id,
    name: serviceChat.name,
    lastMessage: {
      text: serviceChat.lastMessage?.body || '',
      timestamp: serviceChat.lastMessage?.timestamp || 0,
      fromMe: false // This would need to be determined based on session info
    },
    unreadCount: 0, // This would come from the API if available
    isGroup: serviceChat.name.includes('@g.us') || serviceChat.name.includes('group'),
    isAssigned: chatAssignments.length > 0,
    assignedCount: chatAssignments.length,
    developers: developers,
  };
};

// Define the shape of the paginated response
interface ChatPage {
  chats: any;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Define the shape of the paginated messages response
interface MessagesPage {
  messages: any;
  chatType: string;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function AdminChats() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State for the assign chat dialog
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

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

  // React Query for WhatsApp chats with infinite scrolling
  const {
    data: chatsData,
    isLoading: chatsLoading,
    error: chatsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchChats
  } = useInfiniteQuery<ChatPage, Error>({
    queryKey: QUERY_KEYS.CHATS(selectedSession),
    queryFn: async ({ pageParam }) => {
      if (!selectedSession) return {
        chats: [],
        pagination: { limit: 20, offset: 0, hasMore: false }
      };

      const response = await getChats(selectedSession, 20, pageParam as number);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch chats');
      }

      return {
        chats: response.chats || [],
        pagination: {
          limit: 20,
          offset: pageParam as number,
          hasMore: !!response.pagination?.hasMore
        }
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) return undefined;
      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
    enabled: !!selectedSession,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // React Query for Get messages for the selected chat with infinite scrolling
  const {
    data: messagesData,
    error: messagesError,
    isLoading: messagesLoading,
    fetchNextPage: fetchNextMessages,
    hasNextPage: hasMoreMessages,
    isFetchingNextPage: isFetchingNextMessages,
    refetch: refetchMessages,
  } = useInfiniteQuery<MessagesPage, Error>({
    queryKey: ['messages', selectedSession, selectedChat?.id?._serialized],
    queryFn: async ({ pageParam }) => {
      if (!selectedSession || !selectedChat) return {
        messages: [],
        chatType: 'unknown',
        pagination: { limit: 20, offset: 0, hasMore: false }
      };

      const response = await getMessages(
        selectedSession,
        selectedChat.id._serialized,
        20,
        pageParam as number
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch messages');
      }

      return {
        messages: response.messages || [],
        chatType: response.chatType || 'unknown',
        pagination: response.pagination || {
          limit: 20,
          offset: pageParam as number,
          hasMore: false
        }
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) return undefined;
      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
    enabled: !!selectedSession && !!selectedChat,
  });

  // React Query mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (data: SendMessageData) => {
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

  // React Query for assignments
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    refetch: refetchAssignments
  } = useQuery({
    queryKey: ['assignments', selectedSession],
    queryFn: async () => {
      if (!selectedSession) return [];
      const response = await getAssignments(selectedSession);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch assignments');
      }
      return response.assignments || [];
    },
    enabled: status === 'authenticated' && session?.user?.role === 'admin' && !!selectedSession,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Flatten the chats from all pages
  const rawChats = useMemo(() => {
    if (!chatsData) return [];
    return chatsData.pages.flatMap(page => page.chats || []);
  }, [chatsData]);

  // Flatten the messages from all pages
  const messages = useMemo(() => {
    if (!messagesData) return [];
    // Get all messages from all pages
    const allMessages = messagesData.pages.flatMap(page => page.messages || []);
    
    // messages are sorted by timestamp, with oldest first (latest at bottom)
    return allMessages.sort((a, b) => a.timestamp - b.timestamp);
  }, [messagesData]);

  // Transform data
  const assignments = assignmentsData || [];

  // Process assignments for chat display
  const enhancedChats = useMemo(() => {
    if (rawChats.length === 0) return [];
    // Convert each chat with its assignments
    return rawChats.map((chat: any) => transformChat(chat, assignments));
  }, [rawChats, assignments]);

  // Handle chat selection
  const handleChatSelect = useCallback((chat: any) => {
    setSelectedChat(chat);
  }, []);

  // Handle message sending
  const handleSendMessage = useCallback(async () => {
    if (!selectedChat || !newMessage.trim() || !selectedSession) return;

    try {
      await sendMessageMutation.mutateAsync({
        sessionId: selectedSession,
        chatId: selectedChat.id._serialized, // Use serialized ID instead of user ID
        text: newMessage
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

  // Open assign dialog
  const handleOpenAssignDialog = useCallback(() => {
    setIsAssignDialogOpen(true);
  }, []);

  // Close assign dialog
  const handleCloseAssignDialog = useCallback(() => {
    setIsAssignDialogOpen(false);
  }, []);

  // Handle assignment completion
  const handleAssignmentComplete = useCallback(() => {
    // Refresh chat data
    if (selectedSession) {
      refetchChats();
    }
  }, [selectedSession, refetchChats]);

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset selected chat when switching to assignments view
    if (value === 'assignments') {
      setSelectedChat(null);
    }
  };

  // Assignment management - simplified
  const handleUnassignDeveloper = async (chatId: string, developerId: string, developerName: string) => {
    try {
      const response = await unassignChat(chatId, developerId, selectedSession);
      if (response.success) {
        toast.success(`${developerName} unassigned successfully`);
        refetchAssignments();
        refetchChats();
      } else {
        toast.error(response.error || 'Failed to unassign developer');
      }
    } catch (error) {
      console.error('Error unassigning developer:', error);
      toast.error('An error occurred while unassigning the developer');
    }
  };

  // Handle view chat from assignment
  const handleViewChatFromAssignment = (chatId: string) => {
    // Find chat by serialized ID if possible, or fall back to user ID
    const chat = enhancedChats.find(c =>
      c.id._serialized
    );

    if (chat) {
      setSelectedChat(chat);
      setActiveTab('chats');
    } else {
      toast.error("Chat not found. Please try refreshing the page.");
    }
  };

  const handleManageAssignmentFromView = (chatId: string) => {
    // Find chat by serialized ID if possible, or fall back to user ID
    const chat = enhancedChats.find(c =>
      c.id._serialized
    );

    if (chat) {
      setSelectedChat(chat);
      handleOpenAssignDialog();
    } else {
      toast.error("Chat not found. Please try refreshing the page.");
    }
  };

  // Handle direct assign from chat list
  const handleQuickAssign = useCallback((chat: any) => {
    setSelectedChat(chat);
    setIsAssignDialogOpen(true);
  }, []);

  // Auto-select first session when sessions are loaded
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0].id);
    }
  }, [sessions, selectedSession]);

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

      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">WhatsApp Chats</h1>

        {/* Session selector */}
        <div className="mb-6">
          <SessionSelector
            sessions={sessions}
            selectedSession={selectedSession}
            onSessionChange={setSelectedSession}
            isLoading={sessionsLoading}
            onRefreshSessions={refetchSessions}
          />
        </div>

        {sessions.length === 0 && !sessionsLoading ? (
          <NoSessionsState />
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="mt-0">
              <div className="flex bg-white rounded-lg shadow-lg h-[calc(100vh-280px)]">
                {/* Chat List Sidebar */}
                <ChatSidebar
                  chats={enhancedChats as any[]}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedChat={selectedChat}
                  onChatSelect={handleChatSelect}
                  onAssignChat={handleQuickAssign}
                  isLoading={chatsLoading || assignmentsLoading}
                  hasMore={!!hasNextPage}
                  isFetchingMore={isFetchingNextPage}
                  loadMore={fetchNextPage}
                />

                {/* Chat Messages Area */}
                <div className="flex-1 flex flex-col">
                  {selectedChat ? (
                    <>
                      <ChatHeader
                        selectedChat={selectedChat}
                        onOpenAssignDialog={handleOpenAssignDialog}
                      />
                      <MessagesArea
                        messages={messages}
                        isLoading={messagesLoading}
                        hasMore={hasMoreMessages}
                        isFetchingMore={isFetchingNextMessages}
                        loadMore={fetchNextMessages}
                        chatType={messagesData?.pages[0]?.chatType}
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
            </TabsContent>

            <TabsContent value="assignments" className="mt-0">
              <AssignmentsView
                assignments={assignments}
                isLoading={assignmentsLoading}
                onGoToChats={() => setActiveTab('chats')}
                onViewChat={handleViewChatFromAssignment}
                onManageAssignment={handleManageAssignmentFromView}
                onUnassignDeveloper={handleUnassignDeveloper}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Assign Chat Dialog */}
      <AssignChatDialog
        isOpen={isAssignDialogOpen}
        onClose={handleCloseAssignDialog}
        chat={selectedChat}
        sessionId={selectedSession}
        onAssignmentComplete={handleAssignmentComplete}
      />
    </div>
  );
} 
