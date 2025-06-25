'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { getChats, Chat } from '@/services/whatsappService';

export default function DeveloperDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in or not a developer
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'developer') {
      router.push('/admin/dashboard');
    }
  }, [status, session, router]);

  // React Query for fetching assigned chats
  const { 
    data, 
    isLoading: loading, 
    error: queryError, 
    refetch: refetchChats 
  } = useQuery({
    queryKey: ['developerChats'],
    queryFn: async () => {
      const response = await getChats();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    enabled: status === 'authenticated' && session?.user?.role === 'developer',
  });

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      const errorMessage = queryError instanceof Error ? queryError.message : 'Failed to fetch assigned chats';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [queryError]);

  const assignedChats = data?.chats || [];

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (status === 'authenticated' && session?.user?.role !== 'developer') {
    return null; // Will be redirected by useEffect
  }

  const handleRefreshChats = () => {
    setError(null);
    refetchChats();
  };

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
                {assignedChats.map((chat: Chat) => (
                  <div 
                    key={chat.id.user} 
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/developer/chats/${chat.id.user}`)}
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
              <Button variant="outline" onClick={handleRefreshChats} className="mt-4">
                Refresh Chats
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 