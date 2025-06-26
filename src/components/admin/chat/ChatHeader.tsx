import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Developer {
  id: string;
  name: string;
  email: string;
  assignmentId?: string;
}

interface ChatHeaderProps {
  selectedChat: {
    id: {
      user: string;
    };
    name: string;
    isGroup: boolean;
    isAssigned?: boolean;
    developerId?: string;
    developers?: Developer[];
    assignedCount?: number;
  };
  onOpenAssignDialog: () => void;
}

export const ChatHeader = ({ selectedChat, onOpenAssignDialog }: ChatHeaderProps) => {
  // Multiple developers might be assigned to this chat
  const hasMultipleDevs = selectedChat.assignedCount && selectedChat.assignedCount > 1;
  const developers = selectedChat.developers || [];
  
  return (
    <div className="p-4 border-b border-gray-200 bg-green-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-green-100 text-green-600">
              {selectedChat.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium text-gray-900">{selectedChat.name}</h2>
            <p className="text-sm text-gray-600">
              {selectedChat.isGroup ? 'Group chat' : 'Contact'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedChat.isAssigned && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 bg-green-50 border-green-200 text-green-700"
                    >
                      {hasMultipleDevs ? <Users className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      <span>
                        {hasMultipleDevs 
                          ? `${selectedChat.assignedCount} Developers` 
                          : developers.length === 1 
                            ? `Assigned to ${developers[0]?.name?.split(' ')[0]}` 
                            : 'Assigned'}
                      </span>
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  {developers.length > 0 ? (
                    <div className="space-y-2 p-1">
                      <p className="font-medium text-sm">Assigned Developer{developers.length > 1 ? 's' : ''}:</p>
                      <div className="space-y-1">
                        {developers.map(dev => (
                          <div key={dev.assignmentId || dev.id} className="flex items-center gap-2 text-sm">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-green-600 text-white">
                                {dev.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm">{dev.name}</p>
                              <p className="text-xs text-gray-500">{dev.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">This chat is assigned to developer(s)</p>
                  )}
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
            {selectedChat.isAssigned ? (
              <>
                <Users className="h-4 w-4" />
                <span>Manage Developers</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Assign</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Assignment summary when multiple developers */}
      {hasMultipleDevs && developers.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200 flex gap-1 flex-wrap">
          {developers.slice(0, 3).map(dev => (
            <Badge key={dev.assignmentId || dev.id} variant="outline" className="bg-white text-xs">
              {dev.name.split(' ')[0]}
            </Badge>
          ))}
          {developers.length > 3 && (
            <Badge variant="outline" className="bg-white text-xs">
              +{developers.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}; 