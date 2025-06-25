import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Extended Chat type for UI purposes
interface Chat {
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

interface ChatItemProps {
  chat: Chat;
  isSelected: boolean;
  onSelect: (chat: Chat) => void;
  formatTime: (timestamp: number) => string;
}

export const ChatItem = ({ 
  chat, 
  isSelected, 
  onSelect, 
  formatTime 
}: ChatItemProps) => (
  <div
    onClick={() => onSelect(chat)}
    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
      isSelected ? 'bg-green-50 border-l-4 border-l-green-500' : ''
    }`}
  >
    <div className="flex items-start gap-3">
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-green-100 text-green-600">
          {chat.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 ">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate">
            {chat.name}
          </h3>
          <span className="text-xs text-gray-500">
            {formatTime(chat.lastMessage.timestamp)}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate mt-1">
          {chat.lastMessage.fromMe ? 'You: ' : ''}
          {chat.lastMessage.text}
        </p>
        <div className="flex items-center justify-between mt-2">
          {chat.unreadCount > 0 && (
            <Badge variant="default" className="bg-green-500">
              {chat.unreadCount}
            </Badge>
          )}
          {chat.isAssigned && (
            <Badge variant="secondary" className="text-xs">
              Assigned
            </Badge>
          )}
        </div>
      </div>
    </div>
  </div>
);

export type { Chat }; 