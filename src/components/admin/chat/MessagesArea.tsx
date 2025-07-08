import { useEffect, useRef } from 'react';
import { MessageBubble, Message } from './MessageBubble';
import { Loader2 } from 'lucide-react';

interface MessagesAreaProps {
  messages: Message[];
  isLoading: boolean;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loadMore?: () => void;
  chatType?: string;
}

export const MessagesArea = ({ 
  messages, 
  isLoading,
  hasMore = false,
  isFetchingMore = false,
  loadMore,
  chatType = 'personal'
}: MessagesAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef<number>(0);

  // Scroll to bottom on initial load or when new messages are added
  useEffect(() => {
    if (messages.length > 0 && prevMessagesLength.current < messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // Setup intersection observer for infinite scrolling (load older messages)
  useEffect(() => {
    if (!hasMore || !loadMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (messagesStartRef.current) {
      observer.observe(messagesStartRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [hasMore, isFetchingMore, loadMore]);

  return (
    <div 
      className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4"
      ref={containerRef}
    >
      {/* Load more trigger element */}
      {hasMore && (
        <div 
          ref={messagesStartRef}
          className="py-2 text-center"
        >
          {isFetchingMore ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-500">Loading older messages...</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Scroll up to load more messages</span>
          )}
        </div>
      )}
      
      {isLoading && !isFetchingMore ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-green-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No messages yet
        </div>
      ) : (
        <>
          {/* Chat type indicator */}
          <div className="text-xs text-center text-gray-500 mb-2">
            {chatType === 'group' && '👥 Group Chat'}
            {chatType === 'broadcast' && '📢 Broadcast'}
            {chatType === 'channel' && '📣 Channel'}
          </div>
          
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}; 