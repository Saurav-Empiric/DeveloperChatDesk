import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { Loader2 } from 'lucide-react';

interface MessagesAreaProps {
  messages: any;
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
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Get sorted messages with latest at the bottom
  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  // Scroll to bottom button
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserScrolledUp(false);
  };

  // Initial scroll to bottom once messages are loaded
  useEffect(() => {
    if (messages.length > 0 && !initialScrollDone) {
      messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
      setInitialScrollDone(true);
    }
  }, [messages.length, initialScrollDone]);

  // Scroll to bottom when new messages are added, but only if user hasn't scrolled up
  useEffect(() => {
    if (
      messages.length > 0 &&
      prevMessagesLength.current < messages.length &&
      !userScrolledUp
    ) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages, userScrolledUp]);


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

  // Detect user scroll to determine if they've scrolled up
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // If the user is not at the bottom (with a small threshold), they've scrolled up
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setUserScrolledUp(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
      ) : sortedMessages.length === 0 ? (
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

          {/* Message list with proper sorting - latest at bottom */}
          {sortedMessages.map((message: any) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Reference element for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </>
      )}

      {/* Scroll to bottom button - only shown when user has scrolled up */}
      {userScrolledUp && sortedMessages.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-green-600 transition-colors"
          aria-label="Scroll to bottom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
}; 