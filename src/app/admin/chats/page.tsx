'use client';

import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDevelopers } from '@/services/developerService';
import {
  getAssignments,
  getChats,
  getMessages,
  getSessions,
  sendMessage as sendMessageService,
  unassignChat,
  type MessageData,
  type Chat as ServiceChat,
  type Message as ServiceMessage
} from '@/services/whatsappService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Import chat components
import {
  AssignChatDialog,
  ChatHeader,
  ChatSidebar,
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
  fromMe: serviceMessage.from === 'me',
  isFromMe: serviceMessage.from === 'me'
});

// Define interfaces for type safety
interface Developer {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
}

interface DevelopersResponse {
  success: boolean;
  developers: Developer[];
}

export default function AdminChats() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State for the assign chat dialog
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

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

  // Get messages for the selected chat
  const {
    data: messagesData,
    error: messagesError,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['messages', selectedSession, selectedChat?.id?.user],
    queryFn: async () => {
      if (!selectedSession || !selectedChat) return { success: true, messages: [] };
      return getMessages(selectedSession, selectedChat.id.user);
    },
    enabled: !!selectedSession && !!selectedChat,
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


  // React Query for assignments
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    refetch: refetchAssignments
  } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const response = await getAssignments();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch assignments');
      }
      return response.assignments || [];
    },
    enabled: status === 'authenticated' && session?.user?.role === 'admin' && activeTab === 'assignments',
  });

  // React Query for developers (needed for assignments view)
  const {
    data: developersData,
    isLoading: developersLoading,
  } = useQuery({
    queryKey: ['developers'],
    queryFn: async () => {
      const response = await getDevelopers();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch developers');
      }
      return response;
    },
    enabled: status === 'authenticated' && session?.user?.role === 'admin' && activeTab === 'assignments',
  });

  // Transform data
  const chats = useMemo(() => rawChats.map(transformChat), [rawChats]);
  const messages = useMemo(() => {
    if (!messagesData?.messages) return [];
    return messagesData.messages.map(transformMessage);
  }, [messagesData]);

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

  // Assignment management
  const handleUnassignChat = async (chatId: string) => {
    try {
      const response = await unassignChat(chatId);
      if (response.success) {
        toast.success('Chat unassigned successfully');
        refetchChats();
        refetchAssignments();
      } else {
        toast.error(response.error || 'Failed to unassign chat');
      }
    } catch (error) {
      console.error('Error unassigning chat:', error);
      toast.error('An error occurred while unassigning the chat');
    }
  };

  // Process assignments data for display
  const assignments = useMemo(() => {
    if (!assignmentsData) return [];

    // Map developers to a lookup object
    // Make sure developers is an array before using reduce
    const developersResponse = developersData as DevelopersResponse | undefined;
    const developers: Developer[] = developersResponse?.developers || [];

    const developerLookup = developers.reduce((acc: Record<string, Developer>, dev: Developer) => {
      acc[dev._id] = dev;
      return acc;
    }, {});

    return assignmentsData.map((assignment: any) => ({
      ...assignment,
      developer: assignment.developerId && developerLookup[assignment.developerId.toString()]
        ? {
          name: developerLookup[assignment.developerId.toString()].userId?.name || 'Unknown',
          email: developerLookup[assignment.developerId.toString()].userId?.email || '',
        }
        : null
    }));
  }, [assignmentsData, developersData]);

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
                      <ChatHeader
                        selectedChat={selectedChat}
                        onOpenAssignDialog={handleOpenAssignDialog}
                      />
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
            </TabsContent>

            <TabsContent value="assignments" className="mt-0">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Chat Assignments</h2>

                {assignmentsLoading || developersLoading ? (
                  <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-4">No chats are currently assigned to developers.</p>
                    <Button
                      onClick={() => setActiveTab('chats')}
                      variant="outline"
                    >
                      Go to Chats to Assign Conversations
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 text-xs uppercase">
                        <tr>
                          <th className="px-6 py-3 text-left">Chat</th>
                          <th className="px-6 py-3 text-left">Assigned Developer</th>
                          <th className="px-6 py-3 text-left">Assigned Date</th>
                          <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {assignments.map((assignment: any) => (
                          <tr key={assignment._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium">{assignment.chatName}</div>
                              <div className="text-xs text-gray-500">{assignment.chatId}</div>
                            </td>
                            <td className="px-6 py-4">
                              {assignment.developer ? (
                                <div>
                                  <div className="font-medium">{assignment.developer.name}</div>
                                  <div className="text-xs text-gray-500">{assignment.developer.email}</div>
                                </div>
                              ) : (
                                <span className="text-gray-500">Unknown Developer</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {new Date(assignment.assignedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const chatName = assignment.chatName;
                                    const developerName = assignment.developer?.name || "developer";

                                    if (window.confirm(`Are you sure you want to unassign ${developerName} from "${chatName}"?`)) {
                                      handleUnassignChat(assignment.chatId);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  Unassign
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Find the chat in the chats array
                                    const chat = chats.find(c => c.id.user === assignment.chatId);
                                    if (chat) {
                                      setSelectedChat(chat);
                                      setActiveTab('chats');
                                      handleOpenAssignDialog();
                                    } else {
                                      toast.error("Chat not found. Please try refreshing the page.");
                                    }
                                  }}
                                >
                                  Manage
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Assign Chat Dialog */}
      <AssignChatDialog
        isOpen={isAssignDialogOpen}
        onClose={handleCloseAssignDialog}
        chat={selectedChat}
        onAssignmentComplete={handleAssignmentComplete}
      />
    </div>
  );
} 
