
// ===== WAHA SESSION TYPES =====
export type SessionStatus = 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';

export interface SessionMetadata {
  [key: string]: string | number | boolean;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  hmac?: {
    key: string;
  };
  customHeaders?: Array<{
    name: string;
    value: string;
  }>;
  retries?: {
    policy: 'constant' | 'exponential';
    delaySeconds: number;
    attempts: number;
  };
}

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

export interface NowebStoreConfig {
  enabled: boolean;
  fullSync: boolean;
}

export interface SessionConfig {
  debug?: boolean;
  noweb?: {
    store: NowebStoreConfig;
  };
  metadata?: SessionMetadata;
  webhooks?: WebhookConfig[];
  proxy?: ProxyConfig;
}

export interface SessionInfo {
  name: string;
  status: SessionStatus;
  config: SessionConfig;
  me?: {
    id: string;
    pushName: string;
  };
  engine: {
    engine: string;
  };
}

export interface CreateSessionRequest {
  name?: string;
  start?: boolean;
  config?: SessionConfig;
}

// ===== WAHA CHAT TYPES =====
export interface ChatId {
  server: string;
  user: string;
  _serialized: string;
}

export interface LastMessage {
  text: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
}

export interface Chat {
  id: ChatId | string;
  name: string;
  lastMessage?: LastMessage;
  unreadCount?: number;
  isGroup: boolean;
  isAssigned?: boolean;
  developerId?: string;
  developers?: Array<{
    id: string;
    name: string;
    email: string;
    assignmentId?: string;
  }>;
  assignedCount?: number;
}

// ===== WAHA MESSAGE TYPES =====
export type MessageType = 
  | 'text' 
  | 'image' 
  | 'audio' 
  | 'video' 
  | 'document' 
  | 'location' 
  | 'contact' 
  | 'sticker' 
  | 'voice' 
  | 'unknown';

export interface MediaInfo {
  url: string;
  mimetype: string;
  filename?: string;
  error?: string;
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  description?: string;
}

export interface ContactInfo {
  name: string;
  number: string;
  formattedName?: string;
}

export interface MessageReaction {
  text: string;
  messageId: string;
}

export interface Message {
  id: string;
  body: string;
  text?: string;
  from: string;
  to: string;
  fromMe: boolean;
  isFromMe?: boolean;
  timestamp: number;
  type: MessageType;
  hasMedia: boolean;
  media?: MediaInfo;
  location?: LocationInfo;
  contacts?: ContactInfo[];
  ack?: number;
  replyTo?: string;
  reaction?: MessageReaction;
  participant?: string;
  vCards?: any[];
  _data?: any;
}

export interface SendMessageRequest {
  chatId: string;
  message?: string;
  text?: string;
  sessionId?: string;
  session?: string;
}

export interface SendMediaMessageRequest extends SendMessageRequest {
  media: File | string;
  caption?: string;
  filename?: string;
}

// ===== WAHA EVENT TYPES =====
export type WahaEventType = 
  | 'session.status'
  | 'message'
  | 'message.any'
  | 'message.reaction'
  | 'message.ack'
  | 'message.waiting'
  | 'message.revoked'
  | 'message.edited'
  | 'engine.event';

export interface WahaEvent<T = any> {
  event: WahaEventType;
  session: string;
  payload: T;
  me?: {
    id: string;
    pushName: string;
  };
  engine?: string;
  environment?: {
    version: string;
    engine: string;
    tier: string;
  };
  timestamp?: number;
  metadata?: SessionMetadata;
}

export interface SessionStatusEvent extends WahaEvent<{ status: SessionStatus }> {
  event: 'session.status';
}

export interface MessageEvent extends WahaEvent<Message> {
  event: 'message' | 'message.any';
}

export interface MessageReactionEvent extends WahaEvent<Message & { reaction: MessageReaction }> {
  event: 'message.reaction';
}

export interface MessageAckEvent extends WahaEvent<Message & { ack: number }> {
  event: 'message.ack';
}

export interface MessageRevokedEvent extends WahaEvent<{
  before: Partial<Message>;
  after: Partial<Message>;
}> {
  event: 'message.revoked';
}

// ===== WAHA QR & AUTH TYPES =====
export interface QRResponse {
  value?: string;
  mimetype?: string;
  data?: string;
}

export interface PairingCodeRequest {
  phoneNumber: string;
}

export interface PairingCodeResponse {
  code: string;
}

// ===== WAHA RESPONSE TYPES =====
export interface WahaResponse<T = any> {
  data?: T;
  sessions?: SessionInfo[];
  session?: SessionInfo;
  chats?: Chat[];
  messages?: Message[];
  messageId?: string;
}

export interface ChatsResponse extends WahaResponse {
  chats: Chat[];
}

export interface MessagesResponse extends WahaResponse {
  messages: Message[];
}

export interface SessionsResponse extends WahaResponse {
  sessions: SessionInfo[];
}

export interface SendMessageResponse extends WahaResponse {
  messageId: string;
}

// ===== CONTACT & GROUP TYPES =====
export interface Contact {
  id: string;
  name: string;
  number: string;
  isContact: boolean;
  isBlocked: boolean;
  profilePic?: string;
}

export interface GroupParticipant {
  id: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  participants: GroupParticipant[];
  admins: string[];
  createdAt: number;
  createdBy: string;
  inviteCode?: string;
}

// ===== WAHA ENGINE TYPES =====
export type WahaEngine = 'WEBJS' | 'NOWEB' | 'GOWS' | 'VENOM';

export interface EngineInfo {
  engine: WahaEngine;
  version?: string;
  browser?: string;
}

// ===== WAHA SYSTEM STATUS =====
export interface WahaSystemStatus {
  status: string;
  message: string;
  isRunning: boolean;
  version?: string;
  wahaApiUrl?: string;
  errorMessage?: string;
  engine?: EngineInfo;
} 