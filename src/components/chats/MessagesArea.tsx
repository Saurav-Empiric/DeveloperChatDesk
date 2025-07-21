import { formatTime } from "@/lib/utils";
import { CheckCheck, Loader2, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface MessagesAreaProps {
    messages: any;
    messagesLoading: boolean;
    hasMore?: boolean;
    isFetchingMore?: boolean;
    loadMore?: () => void;
}
export const MessagesArea = ({ messages, messagesLoading, hasMore = false,
    isFetchingMore = false,
    loadMore, }: MessagesAreaProps) => {

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [userScrolledUp, setUserScrolledUp] = useState(false);
    const [initialScrollDone, setInitialScrollDone] = useState(false);

    // Auto-scroll to bottom when messages change
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setUserScrolledUp(false);
    }, []);

    // Scroll to bottom when messages change, but only if user hasn't scrolled up
    useEffect(() => {
        const currentMessages = messages.length;
        // Only auto-scroll if we have new messages and user hasn't manually scrolled up
        if (currentMessages > 0 && !userScrolledUp) {
            scrollToBottom();
        }
    }, [messages, userScrolledUp, scrollToBottom]);

    // Initial scroll to bottom once messages are loaded
    useEffect(() => {
        if (messages.length > 0 && !initialScrollDone) {
            messagesEndRef.current?.scrollIntoView();
            setInitialScrollDone(true);
        }
    }, [messages.length, initialScrollDone]);

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

        if (messagesContainerRef.current) {
            observer.observe(messagesContainerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [hasMore, isFetchingMore, loadMore]);

    // Detect user scroll to determine if they've scrolled up
    useEffect(() => {
        const container = messagesContainerRef.current;
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
            className="flex-1 overflow-y-auto px-4 py-2 relative"
            ref={messagesContainerRef}
        >
            {/* Loader for infinite scroll at the top */}
            {hasMore && isFetchingMore && (
                <div className="flex justify-center items-center py-2">
                    <Loader2 className="animate-spin h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-500">Loading messages...</span>
                </div>
            )}
            {/* Scroll to bottom button - only shown when user has scrolled up */}
            {userScrolledUp && messages.length > 0 && (
                <button
                    onClick={scrollToBottom}
                    className="fixed bottom-40 right-4 bg-[#00a884] text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-[#008f72] transition-colors z-10"
                    aria-label="Scroll to bottom"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            )}

            {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin h-8 w-8 text-green-500" />
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center text-[#8696a0] mt-8">
                    <div className="bg-white rounded-lg p-6 mx-auto max-w-md shadow-sm">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[#d1d7db]" />
                        <p className="text-[#3b4a54] font-medium mb-1">No messages here yet...</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-1 py-4">
                    {messages.map((message: any, index: number) => {
                        const showTime = index === 0 ||
                            messages[index - 1].timestamp < message.timestamp - 300; // 5 minutes gap

                        return (
                            <div key={message.id}>
                                {showTime && (
                                    <div className="flex justify-center my-4">
                                        <div className="bg-white text-[#8696a0] text-xs px-3 py-1 rounded-lg shadow-sm">
                                            {formatTime(message.timestamp)}
                                        </div>
                                    </div>
                                )}
                                <div className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'} mb-1`}>
                                    <div
                                        className={`max-w-[65%] px-3 py-2 rounded-lg relative shadow-sm ${message.fromMe
                                            ? 'bg-[#d9fdd3] text-[#111b21]'
                                            : 'bg-white text-[#111b21]'
                                            }`}
                                        style={{
                                            borderRadius: message.fromMe
                                                ? '7.5px 7.5px 7.5px 7.5px'
                                                : '7.5px 7.5px 7.5px 7.5px'
                                        }}
                                    >
                                        <p className="text-sm leading-relaxed break-words">{message.body}</p>
                                        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${message.fromMe ? 'text-[#667781]' : 'text-[#8696a0]'
                                            }`}>
                                            <span>{formatTime(message.timestamp)}</span>
                                            {message.fromMe && (
                                                <CheckCheck className="h-3 w-3 text-[#4fc3f7]" />
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {/* Invisible div to scroll to */}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    )
}
