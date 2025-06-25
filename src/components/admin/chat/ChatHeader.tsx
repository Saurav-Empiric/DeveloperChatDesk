import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatHeaderProps {
  selectedChat: {
    id: {
      user: string;
    };
    name: string;
    isGroup: boolean;
    isAssigned?: boolean;
    developerId?: string;
    developer?: {
      name: string;
      email: string;
    };
  };
  onOpenAssignDialog: () => void;
}

export const ChatHeader = ({ selectedChat, onOpenAssignDialog }: ChatHeaderProps) => (
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
        {selectedChat.isAssigned && selectedChat.developer && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge variant="outline" className="flex items-center gap-1 bg-green-50 border-green-200 text-green-700">
                    <UserCheck className="h-3 w-3" />
                    <span>Assigned to {selectedChat.developer.name.split(' ')[0]}</span>
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-sm">
                  Assigned to: <span className="font-medium">{selectedChat.developer.name}</span>
                  <br />
                  <span className="text-xs text-gray-500">{selectedChat.developer.email}</span>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Button 
          variant={selectedChat.isAssigned ? "outline" : "default"}
          size="sm"
          onClick={onOpenAssignDialog}
          className="flex items-center gap-1"
        >
          <UserPlus className="h-4 w-4" />
          {!selectedChat.isAssigned ? 'Assign' : 'Manage Assignment'}
        </Button>
      </div>
    </div>
  </div>
); 