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
  message: string;
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