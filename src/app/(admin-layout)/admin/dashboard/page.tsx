'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminSessionsAndWahaStatus } from '@/hooks/useAdminSessionsAndWahaStatus';
import { WahaStatus } from '@/services/systemService';
import { CheckCircle, ExternalLink, Loader2, MessageSquare, RefreshCw, Settings, Users, XCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { data, status } = useAdminSessionsAndWahaStatus();

  if (data.isLoading || status === 'loading') {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 md:w-16 md:h-16" /></div>;
  }

  const wahaStatus: WahaStatus = data.wahaStatus || {
    isRunning: false,
    status: 'error',
    message: 'Service status unavailable'
  };

  const sessions: any = data.sessions || [];
  const syncSessionsMutation = data.syncSessionsMutation;

  const syncAndFetchSessions = async () => {
    if (wahaStatus.isRunning) {
      await syncSessionsMutation.mutateAsync();
      await data.refetchSessions();
    } else {
      toast.error('WAHA service is not running. Please start it first.');
    }
  };

  const handleRefreshStatus = () => {
    data.refetchWahaStatus();
  };

  // Error state from shared hook
  if (data.error) {
    let errorMsg = '';
    if (typeof data.error === 'object' && data.error !== null && 'message' in data.error) {
      errorMsg = (data.error as { message: string }).message;
    } else {
      errorMsg = String(data.error);
    }
    return <div className="text-center py-8 text-red-500">{errorMsg}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">

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
                  <Button className='cursor-pointer' onClick={() => window.open(process.env.NEXT_PUBLIC_WAHA_URL, '_blank')}>
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

              {data.error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {typeof data.error === 'object' && data.error !== null && 'message' in data.error ? (data.error as { message: string }).message : String(data.error)}
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
                  {sessions.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-300 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          {session.me &&
                            <p className="font-medium">{session.me?.pushName}</p>
                          }
                          <p className="text-sm text-black font-semibold">Session: {session.name}</p>
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
              <Link
                href="/admin/chats"
                className="w-full cursor-pointer bg-black text-white px-2 md:px-4 py-2 rounded-md hover:bg-gray-800"
              >
                View Chats
              </Link>
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
              <Link
                href="/admin/developers"
                className="w-full cursor-pointer bg-black text-white px-2 md:px-4 py-2 rounded-md hover:bg-gray-800"
              >
                Manage Developers
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 