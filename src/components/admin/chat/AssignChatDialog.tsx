import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDevelopers, type Developer } from '@/services/developerService';
import { createAssignment, unassignChat, getAssignmentByChatId } from '@/services/whatsappService';
import { toast } from 'sonner';
import { Chat } from './index';
import { Loader2, UserCheck, AlertCircle, CheckCircle, UserPlus, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AssignChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat | null;
  onAssignmentComplete: () => void;
}

export const AssignChatDialog = ({
  isOpen,
  onClose,
  chat,
  onAssignmentComplete
}: AssignChatDialogProps) => {
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch developers
  const { data: developerData, isLoading: developersLoading } = useQuery({
    queryKey: ['developers'],
    queryFn: getDevelopers,
    enabled: isOpen,
  });

  // Get current assignment details
  const {
    data: assignmentData,
    isLoading: assignmentLoading,
    refetch: refetchAssignment
  } = useQuery({
    queryKey: ['assignment', chat?.id.user],
    queryFn: async () => {
      if (!chat?.id.user) return { success: false, isAssigned: false, assignments: [] };
      return await getAssignmentByChatId(chat.id.user);
    },
    enabled: isOpen && !!chat,
  });

  // Create assignment mutation
  const assignMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: (data) => {
      toast.success(data.message ?? 'Chat assigned successfully');
      setSelectedDeveloperId('');
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', chat?.id.user] });
      refetchAssignment();
      onAssignmentComplete();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign chat');
    }
  });

  // Remove assignment mutation
  const unassignMutation = useMutation({
    mutationFn: ({ chatId, developerId }: { chatId: string, developerId?: string }) => 
      unassignChat(chatId, developerId),
    onSuccess: (data) => {
      toast.success(data.message ?? 'Chat assignment removed');
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', chat?.id.user] });
      refetchAssignment();
      onAssignmentComplete();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove assignment');
    }
  });

  // Reset state when dialog opens with a new chat
  useEffect(() => {
    if (isOpen && chat) {
      setSelectedDeveloperId('');
      if (chat.id.user) {
        refetchAssignment();
      }
    }
  }, [isOpen, chat, refetchAssignment]);

  const handleAssign = async () => {
    if (!chat || !selectedDeveloperId) return;

    assignMutation.mutate({
      developerId: selectedDeveloperId,
      chatId: chat.id.user,
      chatName: chat.name
    });
  };

  const handleUnassignDeveloper = async (developerId: string) => {
    if (!chat || !chat.id.user) return;
    unassignMutation.mutate({ chatId: chat.id.user, developerId });
  };

  const handleUnassignAll = async () => {
    if (!chat || !chat.id.user) return;
    unassignMutation.mutate({ chatId: chat.id.user });
  };

  const developers = developerData?.developers || [];
  const isSubmitting = assignMutation.isPending || unassignMutation.isPending;
  const currentAssignments = assignmentData?.assignments || [];
  const isAssigned = assignmentData?.isAssigned || currentAssignments.length > 0;
  const isLoading = developersLoading || assignmentLoading;

  // Find assigned developers
  const assignedDevelopers = currentAssignments.length > 0 && developers.length > 0
    ? currentAssignments.map(assignment => {
        const dev = developers.find((d: Developer) => d._id === (assignment.developerId?.toString()));
        return dev ? {
          id: dev._id,
          name: dev.userId?.name || 'Unknown',
          email: dev.userId?.email || '',
          assignmentId: assignment._id
        } : null;
      }).filter(Boolean)
    : [];

  // Filter developers that are already assigned
  const availableDevelopers = developers.filter(dev => 
    !assignedDevelopers.some(assigned => assigned?.id === dev._id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-md mx-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {isAssigned ? (
              <><UserCheck className="h-5 w-5 text-green-500" /> Manage Chat Assignments</>
            ) : (
              <>Assign Chat to Developers</>
            )}
          </DialogTitle>
          <DialogDescription>
            {isAssigned 
              ? "Manage developer assignments for this chat. You can assign additional developers or remove existing assignments." 
              : "Select developers to handle this chat conversation."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : (
            <>
                              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {chat?.name.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm sm:text-base break-words">{chat?.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {chat?.isGroup ? 'Group chat' : 'Individual chat'}
                      </p>
                    </div>
                  </div>
                </div>

                              {assignedDevelopers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Current Assignments</h4>
                    <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                      {assignedDevelopers.map(developer => (
                        <div key={developer?.assignmentId || developer?.id} className="p-2 sm:p-3 border rounded-lg bg-green-50 border-green-100">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                <AvatarFallback className="bg-green-600 text-white text-xs sm:text-sm">
                                  {developer?.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs sm:text-sm truncate">{developer?.name}</p>
                                <p className="text-xs text-gray-600 truncate">{developer?.email}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUnassignDeveloper(developer?.id || '')}
                              disabled={isSubmitting}
                              className="flex-shrink-0 h-7 w-7 p-0 sm:h-8 sm:w-8"
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                              <div>
                  <Label htmlFor="developer" className="text-sm sm:text-base">
                    {isAssigned ? 'Assign to additional developer' : 'Select Developer'}
                  </Label>
                  <Select
                    value={selectedDeveloperId}
                    onValueChange={setSelectedDeveloperId}
                    disabled={isSubmitting || availableDevelopers.length === 0}
                  >
                    <SelectTrigger id="developer" className="mt-2">
                      <SelectValue placeholder="Choose a developer" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDevelopers.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {developers.length === 0 ? 'No developers available' : 'All developers assigned'}
                        </SelectItem>
                      ) : (
                        availableDevelopers.map((developer: Developer) => (
                          <SelectItem key={developer._id} value={developer._id}>
                            <span className="text-sm">{developer.userId.name} ({developer.userId.email})</span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
            </>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting} 
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          
          {isAssigned ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="destructive"
                onClick={handleUnassignAll}
                disabled={isSubmitting || isLoading}
                className="w-full sm:w-auto text-sm"
              >
                {unassignMutation.isPending && (
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                )}
                Remove All
              </Button>
              
              <Button
                variant="default"
                onClick={handleAssign}
                disabled={!selectedDeveloperId || isSubmitting || isLoading || availableDevelopers.length === 0}
                className="w-full sm:w-auto text-sm"
              >
                {assignMutation.isPending ? (
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                )}
                Assign Developer
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleAssign}
              disabled={!selectedDeveloperId || isSubmitting || isLoading}
              className="w-full sm:w-auto text-sm"
            >
              {assignMutation.isPending ? (
                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <UserCheck className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              )}
              Assign Developer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 