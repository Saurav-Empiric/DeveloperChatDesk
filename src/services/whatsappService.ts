import axios, { AxiosError } from 'axios';
export interface Chat {
  id: {
    server: string;
    user: string;
    _serialized: string;
  };
  name: string;
  lastMessage?: {
    body: string;
    timestamp: number;
  };
  isAssigned?: boolean;
  developerId?: string;
}

export interface Message {
  id: string;
  body: string;
  from: string;
  to: string;
  timestamp: number;
  type: string;
}

export interface MessageData {
  sessionId: string;
  chatId: string;
  text: string;
}

export interface WhatsAppSession {
  id: string;
  name: string;
  status: string;
  me?: {
    id: string;
    pushName: string;
  };
}

export interface WhatsAppResponse {
  success: boolean;
  message?: string;
  error?: string;
  chats?: Chat[];
  messages?: Message[];
  sessions?: WhatsAppSession[];
  messageId?: string;
}

// Use ChatAssignment instead of Assignment for consistency
export type Assignment = ChatAssignment;

/**
 * Get all chats
 */
export const getChats = async (sessionId?: string): Promise<WhatsAppResponse> => {
  try {
    const url = sessionId
      ? `/api/whatsapp/chats?sessionId=${sessionId}`
      : '/api/whatsapp/chats';
    const response = await axios.get(url);
    return {
      success: true,
      chats: response.data.chats
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'Failed to fetch chats';
    console.error('Error fetching chats:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get messages for a specific chat
 */
export const getMessages = async (sessionId: string, chatId: string): Promise<WhatsAppResponse> => {
  try {
    const response = await axios.get(`/api/whatsapp/messages?sessionId=${sessionId}&chatId=${chatId}`);
    return {
      success: true,
      messages: response.data.messages
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'Failed to fetch messages';
    console.error('Error fetching messages:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send a message
 */
export const sendMessage = async (data: MessageData): Promise<WhatsAppResponse> => {
  try {
    const response = await axios.post('/api/whatsapp/messages', data);
    return {
      success: true,
      message: 'Message sent successfully',
      messageId: response.data.messageId
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'Failed to send message';
    console.error('Error sending message:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get all sessions
 */
export const getSessions = async (): Promise<WhatsAppResponse> => {
  try {
    const response = await axios.get('/api/whatsapp/sessions');
    return {
      success: true,
      sessions: response.data.sessions
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'Failed to fetch WhatsApp sessions';
    console.error('Error fetching sessions:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync WhatsApp sessions
 */
export const syncSessions = async (): Promise<WhatsAppResponse> => {
  try {
    const response = await axios.post('/api/whatsapp/sync-sessions');
    return {
      success: true,
      message: response.data.message || 'Sessions synced successfully'
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'Failed to sync WhatsApp sessions';
    console.error('Error syncing sessions:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get all chat assignments for a session
 */
export const getAssignments = async (sessionId?: string): Promise<AssignmentResponse> => {
  try {
    const url = sessionId ? `/api/assignments?sessionId=${sessionId}` : '/api/assignments';
    const response = await axios.get(url);
    return {
      success: true,
      assignments: response.data.assignments,
      
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'Failed to fetch chat assignments';
    console.error('Error fetching assignments:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get assignment by chat ID and session
 */
export const getAssignmentByChatId = async (chatId: string, sessionId?: string): Promise<AssignmentResponse> => {
  try {
    const url = sessionId 
      ? `/api/assignments?chatId=${chatId}&sessionId=${sessionId}`
      : `/api/assignments?chatId=${chatId}`;
    const response = await axios.get(url);
    return {
      success: true,
      isAssigned: response.data.isAssigned,
      assignments: response.data.assignments
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'Failed to fetch chat assignment';
    console.error('Error fetching assignment:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Create a new chat assignment
 */
export const createAssignment = async (data: AssignmentData): Promise<AssignmentResponse> => {
  try {
    const response = await axios.post('/api/assignments', data);
    return {
      success: true,
      message: response.data.message,
      assignment: response.data.assignment
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'Failed to assign chat';
    console.error('Error assigning chat:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Delete a chat assignment by ID
 */
export const deleteAssignment = async (assignmentId: string): Promise<AssignmentResponse> => {
  try {
    const response = await axios.delete(`/api/assignments?id=${assignmentId}`);
    return {
      success: true,
      message: 'Assignment removed successfully',
      unassignedChat: response.data.unassignedChat
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'Failed to remove assignment';
    console.error('Error removing assignment:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Delete a chat assignment by chat ID
 */
export const unassignChat = async (chatId: string, developerId?: string, sessionId?: string): Promise<AssignmentResponse> => {
  try {
    let url = `/api/assignments?chatId=${chatId}`;
    if (developerId) {
      url += `&developerId=${developerId}`;
    }
    if (sessionId) {
      url += `&sessionId=${sessionId}`;
    }
      
    const response = await axios.delete(url);
    return {
      success: true,
      message: response.data.message || 'Chat unassigned successfully',
      unassignedChat: response.data.unassignedChat,
      chatDetails: response.data.chatDetails,
      developerDetails: response.data.developerDetails
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'Failed to unassign chat';
    console.error('Error unassigning chat:', error);
    return { success: false, error: errorMessage };
  }
};