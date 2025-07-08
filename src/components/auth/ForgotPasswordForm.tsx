'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { requestPasswordReset } from '@/services/authService';

interface ForgotPasswordFormProps {
  role?: 'admin' | 'developer';
  backUrl: string;
  title?: string;
  subtitle?: string;
}

export default function ForgotPasswordForm({
  role,
  backUrl,
  title = 'Reset Password',
  subtitle = 'Enter your email to receive a password reset link'
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // Use TanStack Query mutation with authService
  const { mutate, isPending } = useMutation({
    mutationFn: async (email: string) => {
      const response = await requestPasswordReset(email, role);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send reset instructions');
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    mutate(email);
  };
  
  return (
    <>
      <div className="space-y-1 mb-4">
        <h2 className="text-2xl font-bold text-center">{title}</h2>
        <p className="text-sm text-gray-600 text-center">
          {subtitle}
        </p>
      </div>
    
      {submitted ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md">
            <p>
              If your email exists in our system, we've sent you instructions 
              on how to reset your password.
            </p>
            <p className="mt-2">
              Please check your email and follow the instructions.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            asChild
          >
            <Link href={backUrl}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            {isPending ? 'Processing...' : 'Send Reset Link'}
          </Button>
          
          <div className="text-center">
            <Link 
              href={backUrl} 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </>
  );
} 