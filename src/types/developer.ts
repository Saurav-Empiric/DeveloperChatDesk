import { UserRole } from './user';

declare global {

    interface Developer {
        _id: string;
        userId: {
            _id: string;
            name: string;
            email: string;
            role: string;
        };
        organizationId?: string;
        createdAt: string;
        updatedAt?: string;
    }

    interface DeveloperData {
        name: string;
        email: string;
        password: string;
    }

    interface DeveloperResponse {
        success: boolean;
        message?: string;
        error?: string;
        developers?: Developer[];
        developer?: Developer;
    }

    interface CreateDeveloperData {
        name: string;
        email: string;
        password: string;
    }

    interface DeveloperInviteData {
        email: string;
        name: string;
        role?: UserRole;
        organizationId?: string;
    }
    interface DevelopersListResponse {
        developers: Developer[];
    }

    interface ChatAssignment {
        _id: string;
        developerId: string;
        chatId: string;
        chatName: string;
        assignedAt: string;
        createdAt?: string;
        updatedAt?: string;
    }

    interface AssignmentWithDetails extends ChatAssignment {
        developer?: {
            id: string;
            name: string;
            email: string;
        };
        chatDetails?: {
            id: string;
            name: string;
            lastMessage?: {
                text: string;
                timestamp: number;
            };
            unreadCount?: number;
            isGroup?: boolean;
        };
    }

    interface AssignmentData {
        developerId: string;
        chatId: string;
        chatName: string;
    }

    interface AssignmentResponse {
        success: boolean;
        message?: string;
        error?: string;
        assignments?: ChatAssignment[];
        assignment?: ChatAssignment;
        isAssigned?: boolean;
        unassignedChat?: string;
        chatDetails?: {
            id: string;
            name: string;
        };
        developerDetails?: {
            id: string;
            name: string;
            email: string;
        };
    }

    interface DeveloperForAssignment {
        id: string;
        name: string;
        email: string;
        assignmentId: string;
        assignedAt: string;
    }

    interface ChatAssignmentForView {
        chatId: string;
        chatName: string;
        developers: DeveloperForAssignment[];
    }

    interface CreateAssignmentData {
        developerId: string;
        chatId: string;
        chatName: string;
        sessionId?: string;
    }

    interface BulkAssignmentData {
        developerIds: string[];
        chatIds: string[];
    }

    interface AssignmentFilters {
        developerId?: string;
        dateFrom?: Date;
        dateTo?: Date;
        search?: string;
    }

    interface AssignmentsListResponse {
        assignments: AssignmentWithDetails[];
        filters?: AssignmentFilters;
    }

}

export { };
