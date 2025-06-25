import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { MessageBubble, type Message } from './MessageBubble';

interface MessagesAreaProps {
  messages: Message[];
  isLoading: boolean;
  isError: boolean;
  formatTime: (timestamp: number) => string;
}

export const MessagesArea = ({
  messages,
  isLoading,
  isError,
  formatTime
}: MessagesAreaProps) => (
  <ScrollArea className="flex-1 p-4 bg-gray-50">
    {isLoading ? (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    ) : isError ? (
      <div className="text-center py-8 text-red-600">
        Failed to load messages
      </div>
    ) : (
      <div className="space-y-4">
        {messages.map((message: Message) => (
          <MessageBubble
            key={message.id}
            message={message}
            formatTime={formatTime}
          />
        ))}
      </div>
    )}
  </ScrollArea>
); 