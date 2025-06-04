'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (status === 'unauthenticated') {
        try {
          const response = await axios.get('/api/auth/registration-status');
          if (response.data.canRegister) {
            // If no admin exists, redirect to registration
            router.push('/register');
          } else {
            // Otherwise, redirect to login
            router.push('/login');
          }
        } catch (error) {
          console.error('Error checking registration status:', error);
          // On error, default to login
          router.push('/login');
        } finally {
          setCheckingRegistration(false);
        }
      } else if (status === 'authenticated') {
        // If already logged in, redirect based on role
        if (session?.user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (session?.user?.role === 'developer') {
          router.push('/developer/dashboard');
        }
        setCheckingRegistration(false);
      }
    };

    if (status !== 'loading') {
      checkRegistrationStatus();
    }
  }, [status, session, router]);

  // Loading state while determining redirect
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-lg font-medium">
        {checkingRegistration || status === 'loading' ? 'Loading...' : ''}
      </div>
    </div>
  );
}
