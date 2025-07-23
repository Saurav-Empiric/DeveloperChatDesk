interface WahaMessage {
  id: string;
  timestamp: number;
  from: string;
  fromMe: boolean;
  source: 'app' | 'api';
  to: string;
  body: string;
  hasMedia: boolean;
  media: WahaMedia | null;
  ack: number;
  ackName: 'ERROR' | 'PENDING' | 'SERVER' | 'DEVICE' | 'READ' | 'PLAYED' | 'UNKNOWN';
  vCards: any[];
  replyTo?: string; // ID of the message being replied to
  participant?: string; // For group messages, the participant who sent the message
  _data: WahaMessageData;
}

// Media structure
interface WahaMedia {
  url: string;
  mimetype: string;
  filename: string | null;
  error: string | null;
}

// Internal data structure (varies by engine)
interface WahaMessageData {
  id: {
    fromMe: boolean;
    remote: string;
    id: string;
    _serialized: string;
  };
  viewed: boolean;
  body: string;
  type: string;
  subtype?: string;
  t: number;
  notifyName: string;
  from: {
    server: string;
    user: string;
    _serialized: string;
  };
  to: {
    server: string;
    user: string;
    _serialized: string;
  };
  ack: number;
  invis: boolean;
  star: boolean;
  kicNotified: boolean;
  mediaKey?: string;
  mediaKeyTimestamp?: number;
  thumbnailDirectPath?: string;
  thumbnailSha256?: string;
  thumbnailEncSha256?: string;
  thumbnailHeight?: number;
  thumbnailWidth?: number;
  isFromTemplate?: boolean;
  matchedText?: string;
  thumbnail?: string;
  // Additional fields may exist depending on the engine used
  [key: string]: any;
}

// Query parameters for get messages endpoint
interface WahaGetMessagesParams {
  session: string;
  chatId: string;
  limit?: number;
  offset?: number;
  downloadMedia?: boolean;
  cursor?: string;
}

// Webhook event structure
interface WahaWebhookEvent {
  id: string; // ULID format
  timestamp: number;
  event: 'message' | 'message.any' | 'message.reaction' | 'message.ack' | 'message.waiting' | 'message.edited' | 'message.revoked' | 'session.status' | 'chat.archive' | 'group.v2.join' | 'group.v2.leave' | 'group.v2.participants' | 'group.v2.update' | 'presence.update' | 'poll.vote' | 'poll.vote.failed' | 'label.upsert' | 'label.deleted' | 'label.chat.added' | 'label.chat.deleted' | 'call.received' | 'call.accepted' | 'call.rejected' | 'engine.event';
  session: string;
  metadata?: Record<string, any>;
  me?: {
    id: string;
    pushName: string;
  };
  payload: WahaMessage | any; // Payload varies by event type
  environment: {
    tier: 'CORE' | 'PLUS';
    version: string;
    engine: 'WEBJS' | 'NOWEB' | 'GOWS' | 'VENOM';
    browser?: string;
  };
  engine: 'WEBJS' | 'NOWEB' | 'GOWS' | 'VENOM';
}

// Message reaction structure
interface WahaMessageReaction {
  id: string;
  from: string;
  fromMe: boolean;
  participant?: string;
  to: string;
  timestamp: number;
  reaction: {
    text: string; // Emoji or empty string if removed
    messageId: string;
  };
}

// Message acknowledgment structure
interface WahaMessageAck {
  id: string;
  from: string;
  participant?: string | null;
  fromMe: boolean;
  ack: number;
  ackName: 'ERROR' | 'PENDING' | 'SERVER' | 'DEVICE' | 'READ' | 'PLAYED';
}

// Message revoke structure
interface WahaMessageRevoked {
  after: {
    id: string;
    _data: any;
    [key: string]: any;
  };
  revokedMessageId: string;
  before: any | null;
}

// Chat identifiers
type WahaChatId = string; // Format: phone@c.us, group@g.us, channel@newsletter

// Error response
interface WahaErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

// API client configuration
interface WahaClientConfig {
  baseUrl: string;
  apiKey?: string;
  session?: string;
}

// Main API client interface
interface WahaApiClient {
  getMessages(params: WahaGetMessagesParams): Promise<WahaMessage[]>;
  getMessageById(session: string, chatId: string, messageId: string): Promise<WahaMessage>;
  sendText(session: string, chatId: string, text: string): Promise<WahaMessage>;
  sendImage(session: string, chatId: string, file: any, caption?: string): Promise<WahaMessage>;
  // Add other methods as needed
}

declare global {

  interface GetChatsResponse {
    success: boolean;
    chats?: any;
    pagination?: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    error?: string;
  }

  interface GetMessagesResponse {
    success: boolean;
    messages?: WahaMessage[];
    chatType?: string;
    pagination?: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    error?: string;
  }

  interface SendMessageData {
    chatId: string;
    text: string;
    sessionId: string;
  }

  interface SendMessageResponse {
    success: boolean;
    message?: string;
    messageId?: string;
    error?: string;
  }

  interface GetSessionsResponse {
    success: boolean;
    sessions?: {
      id: string;
      name: string;
      status: string;
      me?: {
        id: string;
        pushName: string;
      };
      isActive: boolean;
    }[];
    error?: string;
  }

  interface SyncSessionsResponse {
    success: boolean;
    message?: string;
    error?: string;
  }

}

export { };
