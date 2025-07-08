'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '@/services/authService';

interface ResetPasswordFormProps {
  role?: 'admin' | 'developer';
  loginUrl: string;
  forgotUrl: string;
  title?: string;
  subtitle?: string;
}

export default function ResetPasswordForm({ 
  role = 'admin',
  loginUrl,
  forgotUrl,
  title = 'Reset Your Password',
  subtitle = 'Enter a new secure password'
}: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  
  // Use TanStack Query mutation with authService
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: PasswordResetData) => {
      const response = await resetPassword(data);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      setResetComplete(true);
      
      // Redirect to login page with success message
      setTimeout(() => {
        router.push(loginUrl);
        toast.success('Password reset successful! You can now login with your new password.');
      }, 1500);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset password');
    }
  });
  
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
    
    // Call the reset password mutation
    mutate({ token, email, password });
  };
  
  return (
    <>
      <div className="space-y-1 mb-4">
        <h2 className="text-2xl font-bold text-center">{title}</h2>
        {!resetComplete && (
          <p className="text-sm text-gray-600 text-center">
            {subtitle}
          </p>
        )}
      </div>
    
      {resetComplete ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md">
            <p>
              Your password has been reset successfully.
            </p>
            <p className="mt-2">
              You will be redirected to the login page.
            </p>
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
              disabled={isPending}
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
              disabled={isPending}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isPending || !token || !email}
          >
            {isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            {isPending ? 'Resetting Password...' : 'Reset Password'}
          </Button>
          
          <div className="text-center">
            <Link 
              href={forgotUrl} 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Request a new reset link
            </Link>
          </div>
        </form>
      )}
    </>
  );
} 