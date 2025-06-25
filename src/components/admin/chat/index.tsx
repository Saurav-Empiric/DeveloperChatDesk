// Chat components export file
import { ChatHeader } from './ChatHeader';
import { ChatItem } from './ChatItem';
import { ChatSidebar } from './ChatSidebar';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { MessagesArea } from './MessagesArea';
import { SessionSelector } from './SessionSelector';
import { AssignChatDialog } from './AssignChatDialog';

// Chat states
import { NoSessionsState } from './ChatStates';
import { NoChatSelectedState } from './ChatStates';
import { ErrorMessage } from './ChatStates';
import { LoadingSpinner } from './ChatStates';

// Types
export interface Chat {
  id: {
    server: string;
    user: string;
    _serialized: string;
  };
  name: string;
  lastMessage: {
    text: string;
    timestamp: number;
    fromMe: boolean;
  };
  unreadCount: number;
  isGroup: boolean;
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
  text: string;
  fromMe: boolean;
  isFromMe: boolean;
}

export {
  ChatHeader,
  ChatItem,
  ChatSidebar,
  MessageBubble,
  MessageInput,
  MessagesArea,
  SessionSelector,
  AssignChatDialog,
  
  // States
  NoSessionsState,
  NoChatSelectedState,
  ErrorMessage,
  LoadingSpinner
}; 