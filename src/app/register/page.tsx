'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getRegistrationStatus, register, RegistrationData } from '@/services/authService';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // React Query for checking registration status
  const {
    data: regStatusData,
    isLoading: checkingStatus,
    error: regStatusError
  } = useQuery({
    queryKey: ['registrationStatus'],
    queryFn: async () => {
      const response = await getRegistrationStatus();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
  });

  const canRegister = regStatusData?.canRegister || false;

  // React Query mutation for registration
  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      const response = await register(data);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      router.push('/login?registered=true');
    },
    onError: (error: Error) => {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration');
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (regStatusError) {
      setError('Failed to check registration status. Please try again.');
    }
  }, [regStatusError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    registerMutation.mutate({ name, email, password });
  };

  if (status === 'loading' || checkingStatus) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-10 h-10 md:w-16 md:h-16" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Create Admin Account</CardTitle>
        </CardHeader>
        <CardContent>
          {!canRegister ? (
            <div className="text-center py-4">
              <p className="text-red-500 mb-4">Registration is not available.</p>
              <p>An admin account already exists. Please login instead.</p>
              <Button
                className="mt-4"
                onClick={() => router.push('/login')}
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Creating Account...' : 'Register'}
              </Button>

              <div className="text-center text-sm">
                <a
                  href="/login"
                  className="text-blue-500 hover:underline"
                >
                  Already have an account? Login
                </a>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center text-gray-500 w-full">
            WhatsApp Client-Developer Management Platform
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 