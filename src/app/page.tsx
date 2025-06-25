'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getRegistrationStatus } from '@/services/authService';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // React Query for checking registration status
  const {
    data: regStatusData,
    isLoading: checkingRegistration,
    error: regStatusError
  } = useQuery({
    queryKey: ['homeRegistrationStatus'],
    queryFn: async () => {
      const response = await getRegistrationStatus();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    enabled: status === 'unauthenticated',
  });

  // Handle errors from registration status check
  useEffect(() => {
    if (regStatusError) {
      const errorMessage = regStatusError instanceof Error ?
        regStatusError.message :
        'Failed to check registration status';
      setError(errorMessage);
      toast.error(errorMessage);
      // On error, default to login
      router.push('/login');
    }
  }, [regStatusError, router]);

  useEffect(() => {
    if (status === 'unauthenticated' && !checkingRegistration && regStatusData) {
      if (regStatusData.canRegister) {
        // If no admin exists, redirect to registration
        router.push('/register');
      } else {
        // Otherwise, redirect to login
        router.push('/login');
      }
    } else if (status === 'authenticated') {
      // If already logged in, redirect based on role
      if (session?.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (session?.user?.role === 'developer') {
        router.push('/developer/dashboard');
      }
    }
  }, [status, session, router, regStatusData, checkingRegistration]);

  // Loading state while determining redirect
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-lg font-medium">
        {checkingRegistration || status === 'loading' ? <Loader2 className="animate-spin w-10 h-10 md:w-16 md:h-16" /> : ''}
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
    </div>
  );
}
