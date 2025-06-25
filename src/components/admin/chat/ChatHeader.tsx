import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { type Chat } from './ChatItem';

interface ChatHeaderProps {
  selectedChat: Chat;
}

export const ChatHeader = ({ selectedChat }: ChatHeaderProps) => (
  <div className="p-4 border-b border-gray-200 bg-green-50">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-green-100 text-green-600">
            {selectedChat.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-medium text-gray-900">{selectedChat.name}</h2>
          <p className="text-sm text-gray-600">
            {selectedChat.isGroup ? 'Group' : 'Contact'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {selectedChat.isAssigned && (
          <Badge variant="secondary">Assigned</Badge>
        )}
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
); 