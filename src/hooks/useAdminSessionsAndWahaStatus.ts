
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWahaStatus } from '@/services/systemService';
import { getSessions, syncSessions } from '@/services/whatsappService';
import { toast } from 'sonner';

export function useAdminSessionsAndWahaStatus() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  // WAHA status
  const {
    data: wahaStatusData,
    isLoading: wahaStatusLoading,
    error: wahaError,
    refetch: refetchWahaStatus
  } = useQuery({
    queryKey: ['wahaStatus'],
    queryFn: async () => {
      const response = await getWahaStatus();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.wahaStatus;
    },
    enabled: status === 'authenticated' && session?.user?.role === 'admin',
  });

  // WhatsApp sessions
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['whatsappSessions'],
    queryFn: async () => {
      const response = await getSessions();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.sessions;
    },
    enabled: status === 'authenticated' && session?.user?.role === 'admin',
  });

  // Sync sessions mutation
  const syncSessionsMutation = useMutation({
    mutationFn: async () => {
      const response = await syncSessions();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsappSessions'] });
      toast.success(data.message || 'Sessions synced successfully');
    },
    onError: (error: Error) => {
      console.error('Error syncing sessions:', error);
      toast.error(error.message || 'Failed to sync WhatsApp sessions');
    }
  });

  // Error state
  const error = wahaError || sessionsError;
  const isLoading = wahaStatusLoading || sessionsLoading;

  return {
    data: {
      wahaStatus: wahaStatusData || { isRunning: false, status: 'error', message: 'Service status unavailable' },
      sessions: sessionsData || [],
      error,
      isLoading,
      refetchSessions,
      refetchWahaStatus,
      syncSessionsMutation,
    },
    status,
  };
} 