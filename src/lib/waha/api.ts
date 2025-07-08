import axios, { AxiosInstance } from 'axios';

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_WAHA_URL!;
const DEFAULT_API_KEY = process.env.WAHA_API_KEY;

// Chat type constants
export enum ChatType {
  PERSONAL = 'personal',
  GROUP = 'group',
  BROADCAST = 'broadcast',
  CHANNEL = 'channel',
  UNKNOWN = 'unknown'
}

class WahaApiService {
  private api!: AxiosInstance; // Using the definite assignment assertion

  constructor() {
    this.initializeApi();
  }

  private initializeApi() {
    // Get current config
    const apiUrl = DEFAULT_API_URL;
    const apiKey = DEFAULT_API_KEY;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add API key header if available
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }
    
    this.api = axios.create({
      baseURL: apiUrl + '/api',
      headers,
    });
  }

  // Method to refresh API client with latest config
  refreshConfig() {
    this.initializeApi();
  }

  // Session Management
  async getSessions() {
    return this.api.get(`/sessions`);
  }

  async listSessions() {
    return this.api.get(`/sessions`);
  }

  async getSession(sessionId: string) {
    return this.api.get(`/sessions/${sessionId}`);
  }

  async createSession(sessionId: string, config?: any) {
    return this.api.post(`/sessions`, { 
      name: sessionId,
      config
    });
  }

  async startSession(sessionId: string) {
    return this.api.post(`/sessions/${sessionId}/start`);
  }

  async stopSession(sessionId: string) {
    return this.api.post(`/sessions/${sessionId}/stop`);
  }

  async restartSession(sessionId: string) {
    return this.api.post(`/sessions/${sessionId}/restart`);
  }

  async getSessionStatus(sessionId: string) {
    return this.getSession(sessionId);
  }

  async getSessionQR(sessionId: string) {
    return this.api.get(`/${sessionId}/auth/qr`);
  }

  // Chat Management
  async getChats(sessionId: string, limit: number = 20, offset: number = 0) {
    return this.api.get(`/${sessionId}/chats?limit=${limit}&offset=${offset}`);
  }

  // Determine chat type based on chat ID
  determineChatType(chatId: string): ChatType {
    if (chatId.endsWith('@g.us')) {
      return ChatType.GROUP;
    } else if (chatId.endsWith('@broadcast')) {
      return ChatType.BROADCAST;
    } else if (chatId.endsWith('@newsletter')) {
      return ChatType.CHANNEL;
    } else if (chatId.endsWith('@c.us')) {
      return ChatType.PERSONAL;
    } else {
      return ChatType.UNKNOWN;
    }
  }

  // Get messages based on chat type
  async getChatMessages(sessionId: string, chatId: string, limit: number = 20, offset: number = 0) {
    const chatType = this.determineChatType(chatId);
    
    switch (chatType) {
      case ChatType.GROUP:
        return this.getGroupChatMessages(sessionId, chatId, limit, offset);
      case ChatType.BROADCAST:
        return this.getBroadcastMessages(sessionId, chatId, limit, offset);
      case ChatType.CHANNEL:
        return this.getChannelMessages(sessionId, chatId, limit, offset);
      case ChatType.PERSONAL:
      default:
        return this.getPersonalChatMessages(sessionId, chatId, limit, offset);
    }
  }

  // Personal chat messages
  async getPersonalChatMessages(sessionId: string, chatId: string, limit: number = 20, offset: number = 0) {
    console.log('getPersonalChatMessages', sessionId, chatId, limit, offset);
    return this.api.get(`/${sessionId}/chats/${chatId}/messages?limit=${limit}&offset=${offset}`);
  }

  // Group chat messages
  async getGroupChatMessages(sessionId: string, chatId: string, limit: number = 20, offset: number = 0) {
    return this.api.get(`/${sessionId}/chats/${chatId}/messages?limit=${limit}&offset=${offset}`);
  }

  // Broadcast messages
  async getBroadcastMessages(sessionId: string, chatId: string, limit: number = 20, offset: number = 0) {
    return this.api.get(`/${sessionId}/broadcasts/${chatId}/messages?limit=${limit}&offset=${offset}`);
  }

  // Channel messages
  async getChannelMessages(sessionId: string, chatId: string, limit: number = 20, offset: number = 0) {
    return this.api.get(`/${sessionId}/channels/${chatId}/messages?limit=${limit}&offset=${offset}`);
  }

  // Get group info
  async getGroupInfo(sessionId: string, groupId: string) {
    return this.api.get(`/${sessionId}/groups/${groupId}`);
  }

  // Get channel info
  async getChannelInfo(sessionId: string, channelId: string) {
    return this.api.get(`/${sessionId}/channels/${channelId}`);
  }

  // Message Sending
  async sendTextMessage(sessionId: string, chatId: string, text: string) {
    const chatType = this.determineChatType(chatId);
    
    switch (chatType) {
      case ChatType.GROUP:
        return this.api.post(`/sendText`, {
          session: sessionId,
          chatId,
          text,
        });
      case ChatType.CHANNEL:
        return this.api.post(`/${sessionId}/channels/${chatId}/posts`, {
          text
        });
      case ChatType.PERSONAL:
      default:
        return this.api.post(`/sendText`, {
          session: sessionId,
          chatId,
          text,
        });
    }
  }

  async sendImageMessage(sessionId: string, chatId: string, imageUrl: string, caption?: string) {
    const chatType = this.determineChatType(chatId);
    
    switch (chatType) {
      case ChatType.GROUP:
        return this.api.post(`/sendImage`, {
          session: sessionId,
          chatId,
          file: imageUrl,
          caption,
        });
      case ChatType.CHANNEL:
        return this.api.post(`/${sessionId}/channels/${chatId}/posts`, {
          image: imageUrl,
          caption
        });
      case ChatType.PERSONAL:
      default:
        return this.api.post(`/sendImage`, {
          session: sessionId,
          chatId,
          file: imageUrl,
          caption,
        });
    }
  }

  // Webhook Configuration
  async configureWebhook(sessionId: string, url: string, events: string[]) {
    return this.api.post(`/webhook`, {
      session: sessionId,
      url,
      events,
    });
  }
}

export const wahaApi = new WahaApiService(); 
