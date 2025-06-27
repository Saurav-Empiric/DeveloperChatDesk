import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, UserPlus, X, Users, MessageSquare } from 'lucide-react';

interface AssignmentsViewProps {
    assignments: any[];
    isLoading: boolean;
    onGoToChats: () => void;
    onViewChat: (chatId: string) => void;
    onManageAssignment: (chatId: string) => void;
    onUnassignDeveloper: (chatId: string, developerId: string, developerName: string) => void;
}

// Separate card component for better organization
interface AssignmentCardProps {
    chatAssignment: ChatAssignmentForView;
    onViewChat: (chatId: string) => void;
    onManageAssignment: (chatId: string) => void;
    onUnassign: (chatId: string, developerId: string, developerName: string) => void;
}


// Separate developer row component
interface DeveloperRowProps {
    developer: DeveloperForAssignment;
    onUnassign: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
    chatAssignment,
    onViewChat,
    onManageAssignment,
    onUnassign,
}) => {
    return (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Chat Header */}
            <div className="bg-green-50 p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{chatAssignment.chatName}</h3>
                        <p className="text-xs text-gray-500 font-mono">{chatAssignment.chatId}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-600">
                                {chatAssignment.developers.length} developer{chatAssignment.developers.length !== 1 ? 's' : ''} assigned
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewChat(chatAssignment.chatId)}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            View Chat
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onManageAssignment(chatAssignment.chatId)}
                            className="text-green-600 hover:text-green-700"
                        >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Manage
                        </Button>
                    </div>
                </div>
            </div>

            {/* Developers List */}
            <div className="p-4">
                <div className="space-y-3">
                    {chatAssignment.developers.map((developer: DeveloperForAssignment) => (
                        <DeveloperRow
                            key={developer.assignmentId}
                            developer={developer}
                            onUnassign={() => onUnassign(chatAssignment.chatId, developer.id, developer.name)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const DeveloperRow: React.FC<DeveloperRowProps> = ({ developer, onUnassign }) => {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-green-600 text-white text-sm font-medium">
                        {developer.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium text-sm text-gray-900">{developer.name}</p>
                    <p className="text-xs text-gray-500">{developer.email}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="text-xs text-gray-500">Assigned</p>
                    <p className="text-xs text-gray-400">
                        {new Date(developer.assignedAt).toLocaleDateString()}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUnassign}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8 w-8 p-0"
                    title={`Unassign ${developer.name}`}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
    assignments,
    isLoading,
    onGoToChats,
    onViewChat,
    onManageAssignment,
    onUnassignDeveloper,
}) => {
    // Group assignments by chat
    const groupedAssignments: ChatAssignmentForView[] = React.useMemo(() => {
        if (!assignments || assignments.length === 0) return [];

        const chatMap = new Map<string, ChatAssignmentForView>();

        assignments.forEach((assignment: any) => {
            const chatId = assignment.chatId;

            if (!chatMap.has(chatId)) {
                chatMap.set(chatId, {
                    chatId,
                    chatName: assignment.chatName,
                    developers: [],
                });
            }

            const chatAssignment = chatMap.get(chatId)!;

            // Extract developer info safely
            const developer: DeveloperForAssignment = {
                id: assignment.developerId?._id ?? '',
                name: assignment.developerId?.userId?.name ?? 'Unknown Developer',
                email: assignment.developerId?.userId?.email ?? '',
                assignmentId: assignment._id,
                assignedAt: assignment.assignedAt,
            };

            chatAssignment.developers.push(developer);
        });

        return Array.from(chatMap.values());
    }, [assignments]);

    const handleUnassign = (chatId: string, developerId: string, developerName: string) => {
        if (window.confirm(`Are you sure you want to unassign ${developerName} from this chat?`)) {
            onUnassignDeveloper(chatId, developerId, developerName);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Chat Assignments</h2>
                <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
            </div>
        );
    }

    if (groupedAssignments.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Chat Assignments</h2>
                <div className="text-center py-12 text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No Assignments Yet</h3>
                    <p className="mb-4">No chats are currently assigned to developers.</p>
                    <Button onClick={onGoToChats} variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Go to Chats to Assign Conversations
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Chat Assignments</h2>
                <div className="text-sm text-gray-500">
                    {groupedAssignments.length} chat{groupedAssignments.length !== 1 ? 's' : ''} assigned
                </div>
            </div>

            <div className="space-y-4">
                {groupedAssignments.map((chatAssignment) => (
                    <AssignmentCard
                        key={chatAssignment.chatId}
                        chatAssignment={chatAssignment}
                        onViewChat={onViewChat}
                        onManageAssignment={onManageAssignment}
                        onUnassign={handleUnassign}
                    />
                ))}
            </div>
        </div>
    );
};
