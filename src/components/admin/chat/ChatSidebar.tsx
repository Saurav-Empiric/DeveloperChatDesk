import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2 } from 'lucide-react';
import { ChatItem, type Chat } from './ChatItem';

interface ChatSidebarProps {
  chats: Chat[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  formatTime: (timestamp: number) => string;
  isLoading: boolean;
}

export const ChatSidebar = ({
  chats,
  searchQuery,
  onSearchChange,
  selectedChat,
  onChatSelect,
  formatTime,
  isLoading
}: ChatSidebarProps) => {
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-1/3 border-r border-gray-200 flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center">
            <Loader2 className="animate-spin h-6 w-6 mx-auto" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'No chats found' : 'No chats available'}
          </div>
        ) : (
          filteredChats.map((chat: Chat) => (
            <ChatItem
              key={chat.id.user}
              chat={chat}
              isSelected={selectedChat?.id.user === chat.id.user}
              onSelect={onChatSelect}
              formatTime={formatTime}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
}; 