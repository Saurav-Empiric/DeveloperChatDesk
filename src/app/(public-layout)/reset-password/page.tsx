'use client';

import { useState, useEffect, Suspense } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle, User } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { resetPassword } from '@/services/authService';

function DeveloperResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  
  // Extract token and email from URL query parameters
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (tokenParam && emailParam) {
      setToken(tokenParam);
      setEmail(emailParam);
    } else {
      toast.error('Invalid password reset link. Please request a new one.');
    }
  }, [searchParams]);
  
  // Use TanStack Query mutation with authService
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: PasswordResetData) => {
      const response = await resetPassword(data);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      setResetComplete(true);
      toast.success('Password has been reset successfully');
      
      // Redirect to login page after 2 seconds
        router.push('/login?passwordReset=true');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'An error occurred while resetting your password');
      console.error('Password reset error:', error);
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!password) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (!token || !email) {
      toast.error('Invalid reset link. Please request a new one.');
      return;
    }
    
    resetPasswordMutation.mutate({ token, email, password });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <User className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center">Reset Developer Password</h1>
          <p className="text-sm text-gray-600 text-center">
            Enter a new secure password for your developer account
          </p>
        </CardHeader>
        <CardContent>
          {resetComplete ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Success!</p>
                  <p>
                    Your password has been reset successfully.
                    You will be redirected to the login page.
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email || ''}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={resetPasswordMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={resetPasswordMutation.isPending}
                />
              </div>
              
              {resetPasswordMutation.error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p>{resetPasswordMutation.error.message}</p>
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={resetPasswordMutation.isPending || !token || !email}
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Resetting Password...
                  </>
                ) : 'Reset Password'}
              </Button>
              
              <div className="text-center">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Request a new reset link
                </Link>
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

export default function DeveloperResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><Loader2 className="animate-spin w-10 h-10 md:w-16 md:h-16" /></div>}>
      <DeveloperResetPasswordContent />
    </Suspense>
  );
} 