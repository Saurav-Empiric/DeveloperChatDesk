import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCheck, UserPlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTime } from '@/lib/utils';


interface ChatItemProps {
  chat: any;
  isSelected: boolean;
  onSelect: (chat: any) => void;
  onAssign?: (chat: any) => void;
}

export const ChatItem = ({
  chat,
  isSelected,
  onSelect,
  onAssign
}: ChatItemProps) => {
  const handleClickAssign = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAssign) {
      onAssign(chat);
    }
  };

  return (
    <div
      onClick={() => onSelect(chat)}
      className={`p-4 border-b border-gray-100 flex gap-1 md:gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-green-50 border-l-4 border-l-green-500' : ''
        }`}
    >
      <Avatar className="h-10 md:h-12 w-10 md:w-12">
        <AvatarFallback className="bg-green-100 text-green-600">
          {chat.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="w-full">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate ">
            {chat.name}
          </h3>
          <span className="text-xs text-gray-500 ml-2">
            {formatTime(chat.lastMessage.timestamp)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {chat.unreadCount > 0 && (
              <Badge variant="default" className="bg-green-500">
                {chat.unreadCount}
              </Badge>
            )}

            {chat.isAssigned && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <Badge
                        variant="outline"
                        className="flex gap-1 text-xs text-green-600 border-green-200 bg-green-50"
                      >
                        <UserCheck className="h-3 w-3" />
                        {chat.assignedCount && chat.assignedCount > 1
                          ? `${chat.assignedCount} Devs`
                          : 'Assigned'}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {chat.developers && chat.developers.length > 0 ? (
                      <div className="text-xs p-1">
                        <p className="font-medium mb-1">Assigned to:</p>
                        {chat?.developers?.map((dev: any) => (
                          <p key={dev.assignmentId || dev.id} className="mb-0.5">{dev.name}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs">Assigned to developer(s)</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {onAssign && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 p-1 ml-2 opacity-70 hover:opacity-100"
              onClick={handleClickAssign}
              title={chat.isAssigned ? "Manage Assignments" : "Assign Chat"}
            >
              {chat.isAssigned ?
                <UserCheck className="h-4 w-4 text-green-600" /> :
                <UserPlus className="h-4 w-4 text-gray-600" />
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
