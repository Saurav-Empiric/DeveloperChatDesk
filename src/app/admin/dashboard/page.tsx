'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { MessageSquare, Users, Settings, ExternalLink, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface WhatsAppSession {
  id: string;
  name: string;
  status: string;
  me?: {
    id: string;
    pushName: string;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [wahaStatus, setWahaStatus] = useState<{
    isRunning: boolean;
    wahaApiUrl?: string;
    version?: string;
    errorMessage?: string;
  }>({
    isRunning: false
  });

  useEffect(() => {
    console.log('status: ', session)
    // Redirect if not logged in or not an admin
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/developer/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      checkWahaStatus();
      syncAndFetchSessions();
    }
  }, [status, session]);

  const checkWahaStatus = async () => {
    try {
      const response = await axios.get('/api/system/waha-status');
      setWahaStatus(response.data);
    } catch (error) {
      console.error('Error checking WAHA status:', error);
      setError('Failed to check WAHA service status');
    }
  };

  const syncSessions = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const response = await axios.post('/api/whatsapp/sync-sessions');
      setSyncMessage(response.data.message);
      return response.data;
    } catch (error) {
      console.error('Error syncing sessions:', error);
      setError('Failed to sync WhatsApp sessions');
      return null;
    } finally {
      setSyncing(false);
    }
  };

  const syncAndFetchSessions = async () => {
    // First sync sessions from WAHA to MongoDB
    if (wahaStatus.isRunning) {
      await syncSessions();
    }
    // Then fetch sessions
    await fetchSessions();
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/whatsapp/sessions');
      setSessions(response.data.sessions ?? []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard: {status}</h1>
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
                    disabled={syncing || !wahaStatus.isRunning}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Sessions'}
                  </Button>
                  <Button variant="outline" onClick={checkWahaStatus}>
                    Refresh Status
                  </Button>
                  <Button onClick={() => window.open('http://localhost:3000', '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open WAHA Dashboard
                  </Button>
                </div>
              </div>

              {syncMessage && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
                  {syncMessage}
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
                  {sessions.map((session) => (
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
              {sessions.length === 0 && wahaStatus.isRunning && (
                <p className="text-sm text-amber-600 mt-2">
                  No WhatsApp accounts connected. Connect one in WAHA dashboard first.
                </p>
              )}
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
                Manage developers and their access permissions
              </p>
              <Button onClick={() => router.push('/admin/developers')} className="w-full">
                Manage Developers
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View and manage chat assignments to developers
              </p>
              <Button onClick={() => router.push('/admin/assignments')} className="w-full">
                View Assignments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 