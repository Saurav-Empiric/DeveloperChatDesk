import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react';

// Loading Spinner Component
export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <Loader2 className="animate-spin w-10 h-10 md:w-16 md:h-16" />
  </div>
);

// Error Message Component
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage = ({ message, onRetry }: ErrorMessageProps) => (
  <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md flex items-center justify-between">
    <div className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
);

// No Sessions State Component
export const NoSessionsState = () => (
  <div className="text-center py-12">
    <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">No WhatsApp Sessions Found</h3>
    <p className="text-gray-600 mb-4">
      No connected WhatsApp accounts found. Please connect your WhatsApp account in the WAHA dashboard first.
    </p>
    <Button onClick={() => window.open(process.env.NEXT_PUBLIC_WAHA_URL, '_blank')}>
      Open WAHA Dashboard
    </Button>
  </div>
);

// No Chat Selected State Component
export const NoChatSelectedState = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Chat</h3>
      <p className="text-gray-600">
        Choose a conversation from the sidebar to start messaging
      </p>
    </div>
  </div>
); 