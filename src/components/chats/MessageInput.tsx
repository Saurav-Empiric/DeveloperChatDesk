import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
}

export const MessageInput = ({
  message,
  onMessageChange,
  onSendMessage,
  onKeyPress,
  isLoading
}: MessageInputProps) => (
  <div className="p-4 border-t border-gray-200 bg-white">
    <div className="flex items-center gap-2">
      <Input
        placeholder="Type a message..."
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        onKeyDown={onKeyPress}
        className="flex-1"
        disabled={isLoading}
      />
      <Button 
        onClick={onSendMessage} 
        disabled={!message.trim() || isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  </div>
); 