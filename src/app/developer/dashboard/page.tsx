'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

interface Chat {
  id: string;
  name: string;
  lastMessage?: {
    body: string;
    timestamp: number;
  };
}

export default function DeveloperDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignedChats, setAssignedChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in or not a developer
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'developer') {
      router.push('/admin/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'developer') {
      fetchAssignedChats();
    }
  }, [status, session]);

  const fetchAssignedChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/whatsapp/chats');
      setAssignedChats(response.data.chats);
    } catch (error) {
      console.error('Error fetching assigned chats:', error);
      setError('Failed to fetch assigned chats');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (status === 'authenticated' && session?.user?.role !== 'developer') {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Assigned Chats</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading chats...</p>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : assignedChats.length === 0 ? (
              <p>No chats assigned to you yet.</p>
            ) : (
              <div className="space-y-4">
                {assignedChats.map((chat) => (
                  <div 
                    key={chat.id} 
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/developer/chats/${chat.id}`)}
                  >
                    <h3 className="font-medium">{chat.name}</h3>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {chat.lastMessage.body}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4">
              <Button variant="outline" onClick={fetchAssignedChats} className="mt-4">
                Refresh Chats
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 