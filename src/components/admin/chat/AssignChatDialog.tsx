import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { developerService, type Developer } from '@/services/developerService';
import { createAssignment, deleteAssignment, unassignChat, getAssignmentByChatId } from '@/services/whatsappService';
import { toast } from 'sonner';
import { Chat } from './index';
import { Loader2, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';
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
    queryFn: developerService.getDevelopers,
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
      if (!chat?.id.user) return { success: false, isAssigned: false, assignment: null };
      return await getAssignmentByChatId(chat.id.user);
    },
    enabled: isOpen && !!chat,
  });

  // Create assignment mutation
  const assignMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      toast.success('Chat assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', chat?.id.user] });
      onAssignmentComplete();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign chat');
    }
  });

  // Remove assignment mutation
  const unassignMutation = useMutation({
    mutationFn: (chatId: string) => unassignChat(chatId),
    onSuccess: () => {
      toast.success('Chat assignment removed');
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', chat?.id.user] });
      onAssignmentComplete();
      onClose();
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

  const handleUnassign = async () => {
    if (!chat || !chat.id.user) return;
    unassignMutation.mutate(chat.id.user);
  };

  const developers = developerData?.developers || [];
  const isSubmitting = assignMutation.isPending || unassignMutation.isPending;
  const currentAssignment = assignmentData?.assignment;
  const isAssigned = assignmentData?.isAssigned || false;
  const isLoading = developersLoading || assignmentLoading;

  // Find current developer details
  const currentDeveloper = currentAssignment && developers.length > 0
    ? developers.find((dev: Developer) => dev._id === (currentAssignment as any).developerId?.toString())
    : null;

  // Determine if chat is assigned
  const chatIsAssigned = Boolean(isAssigned || chat?.isAssigned || currentAssignment);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {chatIsAssigned ? (
              <><UserCheck className="h-5 w-5 text-green-500" /> Manage Chat Assignment</>
            ) : (
              <>Assign Chat to Developer</>
            )}
          </DialogTitle>
          <DialogDescription>
            {chatIsAssigned 
              ? "This chat is currently assigned. You can reassign it to a different developer or remove the assignment." 
              : "Select a developer to handle this chat conversation."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {chat?.name.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{chat?.name}</h3>
                    <p className="text-sm text-gray-600">
                      {chat?.isGroup ? 'Group chat' : 'Individual chat'}
                    </p>
                  </div>
                </div>
              </div>

              {chatIsAssigned && currentDeveloper && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2">Current Assignment</h4>
                  <div className="p-4 border rounded-lg bg-green-50 border-green-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-green-600 text-white">
                          {currentDeveloper.userId.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{currentDeveloper.userId.name}</p>
                        <p className="text-xs text-gray-600">{currentDeveloper.userId.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-4">
                <div>
                  <Label htmlFor="developer" className="text-base">
                    {chatIsAssigned ? 'Reassign to a different developer' : 'Select Developer'}
                  </Label>
                  <Select
                    value={selectedDeveloperId}
                    onValueChange={setSelectedDeveloperId}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="developer" className="mt-2">
                      <SelectValue placeholder="Choose a developer" />
                    </SelectTrigger>
                    <SelectContent>
                      {developers.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No developers available
                        </SelectItem>
                      ) : (
                        developers.map((developer: Developer) => (
                          <SelectItem key={developer._id} value={developer._id}>
                            {developer.userId.name} ({developer.userId.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {chatIsAssigned && (
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md mb-4">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Reassigning this chat will remove the current assignment. The previously assigned developer will no longer have access to this chat.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {chatIsAssigned && (
            <div className="flex flex-col w-full space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button
                variant="destructive"
                onClick={handleUnassign}
                disabled={isSubmitting || isLoading}
                className="w-full sm:w-auto"
              >
                {unassignMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Unassign This Chat
              </Button>
              
              {currentDeveloper && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to unassign ${currentDeveloper.userId.name} from this chat?`)) {
                      handleUnassign();
                    }
                  }}
                  disabled={isSubmitting || isLoading}
                  className="w-full sm:w-auto text-red-500 border-red-200 hover:bg-red-50"
                >
                  {unassignMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Unassign {currentDeveloper.userId.name.split(' ')[0]}
                </Button>
              )}
            </div>
          )}
          
          <div className="flex flex-col w-full space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedDeveloperId || isSubmitting || isLoading}
              className="w-full sm:w-auto"
            >
              {assignMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {chatIsAssigned ? 'Reassign Chat' : 'Assign Chat'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 