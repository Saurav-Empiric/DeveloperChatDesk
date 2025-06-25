'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { MessageSquare, Users, Settings, ExternalLink, CheckCircle, XCircle, RefreshCw, Loader2, UserCheck } from 'lucide-react';
import { getWahaStatus, WahaStatus } from '@/services/systemService';
import { getSessions, syncSessions, WhatsAppSession } from '@/services/whatsappService';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // React Query for checking WAHA status
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

  // React Query for fetching WhatsApp sessions
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
      return response;
    },
    enabled: status === 'authenticated' && session?.user?.role === 'admin',
  });

  const wahaStatus: WahaStatus = wahaStatusData || {
    isRunning: false,
    status: 'error',
    message: 'Service status unavailable'
  };

  const sessions: WhatsAppSession[] = sessionsData?.sessions || [];

  // React Query mutation for syncing sessions
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

  const syncAndFetchSessions = async () => {
    setError(null);
    if (wahaStatus.isRunning) {
      await syncSessionsMutation.mutateAsync();
      await refetchSessions();
    } else {
      toast.error('WAHA service is not running. Please start it first.');
    }
  };

  const handleRefreshStatus = () => {
    setError(null);
    refetchWahaStatus();
  };

  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/developer/dashboard');
    }
  }, [status, session, router]);

  // Update error state when there's an error from queries
  useEffect(() => {
    if (wahaError) {
      const errorMessage = wahaError instanceof Error ? wahaError.message : 'Failed to check WAHA status';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [wahaError]);

  // Update error state when there's a sessions error
  useEffect(() => {
    if (sessionsError) {
      const errorMessage = sessionsError instanceof Error ? sessionsError.message : 'Failed to fetch WhatsApp sessions';
      console.error('Error fetching WhatsApp sessions:', errorMessage);
    }
  }, [sessionsError]);


  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 md:w-16 md:h-16" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage WhatsApp conversations and developers</p>
        </div>

        {/* WAHA Status Card */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                WAHA Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {wahaStatus.isRunning ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <div>
                        <p className="font-medium text-green-700">WAHA Service Connected</p>
                        {wahaStatus.version && (
                          <p className="text-sm text-gray-600">Version: {wahaStatus.version}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-500" />
                      <div>
                        <p className="font-medium text-red-700">WAHA Service Not Running</p>
                        <p className="text-sm text-gray-600">Please start WAHA Docker container</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={syncAndFetchSessions}
                    disabled={syncSessionsMutation.isPending || !wahaStatus.isRunning}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncSessionsMutation.isPending ? 'animate-spin' : ''}`} />
                    {syncSessionsMutation.isPending ? 'Syncing...' : 'Sync Sessions'}
                  </Button>
                  <Button variant="outline" onClick={handleRefreshStatus}>
                    Refresh Status
                  </Button>
                  <Button onClick={() => window.open(process.env.NEXT_PUBLIC_WAHA_URL, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open WAHA Dashboard
                  </Button>
                </div>
              </div>

              {syncSessionsMutation.data?.message && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
                  {syncSessionsMutation.data.message}
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              {!wahaStatus.isRunning && (
                <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">
                  <h4 className="font-medium mb-2">How to start WAHA:</h4>
                  <pre className="bg-blue-100 p-3 rounded text-sm overflow-x-auto mb-2">
                    docker run -it -p 3000:3000/tcp devlikeapro/waha
                  </pre>
                  <p className="text-sm">
                    After starting WAHA, connect your WhatsApp account in the WAHA dashboard,
                    then click "Sync Sessions" to import connected accounts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Connected Sessions Overview */}
        {sessions.length > 0 && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Connected WhatsApp Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.map((session: WhatsAppSession) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          {session.me &&
                            <p className="font-medium">{session.me?.pushName}</p>
                          }
                          <p className="text-sm text-gray-600">Session: {session.name}</p>
                        </div>
                      </div>
                      <Badge variant={session.status === 'WORKING' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                WhatsApp Chats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View and manage WhatsApp conversations from connected accounts
              </p>
              <Button
                onClick={() => router.push('/admin/chats')}
                disabled={!wahaStatus.isRunning || sessions.length === 0}
                className="w-full"
              >
                View Chats
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Developers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage developer accounts who can access assigned chats
              </p>
              <Button
                onClick={() => router.push('/admin/developers')}
                className="w-full"
              >
                Manage Developers
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <UserCheck className="h-5 w-5" />
                Chat Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View and manage which developers are assigned to which chats
              </p>
              <Button
                onClick={() => router.push('/admin/chats?tab=assignments')}
                disabled={!wahaStatus.isRunning || sessions.length === 0}
                className="w-full"
              >
                Manage Assignments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 