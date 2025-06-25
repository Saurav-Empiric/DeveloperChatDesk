import axios, { AxiosInstance } from 'axios';

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_WAHA_URL!;
const DEFAULT_API_KEY = process.env.WAHA_API_KEY;
const DEBUG_API = process.env.DEBUG_API === 'true';

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
  async getChats(sessionId: string) {
    return this.api.get(`/${sessionId}/chats?limit=20&offset=0`);
  }

  async getChatMessages(sessionId: string, chatId: string) {
    return this.api.get(`/${sessionId}/chats/${chatId}/messages`);
  }

  // Message Sending
  async sendTextMessage(sessionId: string, chatId: string, text: string) {
    return this.api.post(`/sendText`, {
      session: sessionId,
      chatId,
      text,
    });
  }

  async sendImageMessage(sessionId: string, chatId: string, imageUrl: string, caption?: string) {
    return this.api.post(`/sendImage`, {
      session: sessionId,
      chatId,
      file: imageUrl,
      caption,
    });
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
