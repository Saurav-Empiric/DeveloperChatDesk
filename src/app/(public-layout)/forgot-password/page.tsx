'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { requestPasswordReset } from '@/services/authService';

export default function DeveloperForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // Use TanStack Query mutation with authService
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await requestPasswordReset(email, 'developer');
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: (data) => {
      setSubmitted(true);
      toast.success('Password reset email sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'An error occurred. Please try again later.');
      console.error('Password reset request error:', error);
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    forgotPasswordMutation.mutate(email);
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
          <h1 className="text-2xl font-bold text-center">Developer Password Reset</h1>
          <p className="text-sm text-gray-600 text-center">
            Reset your developer account password
          </p>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Success!</p>
                  <p>
                    Password reset instructions have been sent to your email.
                    Please check your inbox and follow the instructions.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href="/login">
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
                  placeholder="developer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={forgotPasswordMutation.isPending}
                />
              </div>
              
              {forgotPasswordMutation.error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p>{forgotPasswordMutation.error.message}</p>
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Processing...
                  </>
                ) : 'Send Reset Link'}
              </Button>
              
              <div className="text-center">
                <Link 
                  href="/login" 
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Back to Login
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