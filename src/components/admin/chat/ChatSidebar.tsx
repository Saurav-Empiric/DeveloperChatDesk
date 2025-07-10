import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, Users, ChevronDown } from 'lucide-react';
import { ChatItem } from './ChatItem';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatSidebarProps {
  chats: any;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedChat: any | null;
  onChatSelect: (chat: any) => void;
  onAssignChat?: (chat: any) => void;
  isLoading: boolean;
  showAssigned?: boolean;
  // Infinite scrolling props
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loadMore?: () => void;
}

export const ChatSidebar = ({
  chats,
  searchQuery,
  onSearchChange,
  selectedChat,
  onChatSelect,
  onAssignChat,
  isLoading,
  showAssigned = false,
  hasMore = false,
  isFetchingMore = false,
  loadMore
}: ChatSidebarProps) => {
  const [filterAssigned, setFilterAssigned] = useState<boolean>(showAssigned);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  const filteredChats = chats.filter((chat: any) => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    // If filter is active, only show assigned chats
    if (filterAssigned && !chat.isAssigned) {
      return false;
    }
    return matchesSearch;
  });

  // Setup intersection observer for infinite scrolling
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !isFetchingMore && loadMore) {
      loadMore();
    }
  }, [hasMore, isFetchingMore, loadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: scrollRef.current,
      rootMargin: '20px',
      threshold: 0.1
    });
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [handleObserver]);

  return (
    <div className="w-1/3 border-r border-gray-200 flex flex-col">
      {/* Search Bar and Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filter toggle */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {filteredChats.length} chats
          </span>
          <Button 
            variant={filterAssigned ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAssigned(!filterAssigned)}
            className="h-8 text-xs gap-1"
          >
            <Users className="h-3.5 w-3.5" />
            {filterAssigned ? 'Showing Assigned' : 'Show Assigned'}
          </Button>
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        {isLoading && !isFetchingMore ? (
          <div className="p-8 text-center">
            <Loader2 className="animate-spin h-6 w-6 mx-auto text-green-500" />
            <p className="text-sm text-gray-500 mt-2">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery || filterAssigned ? 
              <div>
                <p className="mb-2">No chats found</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    onSearchChange('');
                    setFilterAssigned(false);
                  }}
                >
                  Clear filters
                </Button>
              </div> : 
              'No chats available'
            }
          </div>
        ) : (
          <>
            {filteredChats.map((chat: any) => (
              <ChatItem
                key={chat.id.user}
                chat={chat}
                isSelected={selectedChat?.id.user === chat.id.user}
                onSelect={onChatSelect}
                onAssign={onAssignChat}
              />
            ))}
            
            {/* Loader element for intersection observer */}
            {!isLoading && hasMore && (
              <div 
                ref={loaderRef}
                className="p-4 text-center"
              >
                {isFetchingMore ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="animate-spin h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-500">Loading more...</span>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => loadMore && loadMore()}
                    className="text-xs flex items-center gap-1"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    Load more
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
}; 