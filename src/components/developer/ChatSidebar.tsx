'use client'

import { Avatar, AvatarFallback } from "@radix-ui/react-avatar"
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MessageSquare, MoreVertical, RefreshCw, Search, Users } from "lucide-react";
import { Input } from "../ui/input";
import { useCallback } from "react";
import { Session } from "next-auth";
import { formatTime } from "@/lib/utils";

interface DeveloperChatSidebarProps {
    session: Session | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedChat: any;
    setSelectedChat: (chat: any) => void;
    chatsLoading: boolean;
    filteredChats: any;
    handleRefresh: () => void;
}

export const DeveloperChatSidebar = ({ session, searchQuery, setSearchQuery, selectedChat, setSelectedChat, chatsLoading, filteredChats, handleRefresh }: DeveloperChatSidebarProps) => {

    return (
        <div className="w-full md:max-w-[400px] bg-white border-r border-[#e9edef] flex flex-col">
            {/* Header */}
            <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 border-b border-[#e9edef]">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-full bg-[#00a884] text-white text-lg flex items-center justify-center">
                        <AvatarFallback className="">
                            {session?.user?.name?.charAt(0).toUpperCase() || 'D'}
                        </AvatarFallback>
                    </Avatar>
                    <h1 className="text-[#41525d] font-medium">Chats</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={chatsLoading}
                        className="text-[#54656f] hover:bg-[#f5f6f6] h-8 w-8 p-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${chatsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#54656f] hover:bg-[#f5f6f6] h-8 w-8 p-0"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-[#e9edef]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
                    <Input
                        placeholder="Search or start new chat"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 bg-[#f0f2f5] border-none text-[#3b4a54] placeholder-[#8696a0] focus:bg-white focus:ring-1 focus:ring-[#00a884]"
                    />
                </div>
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1">
                {chatsLoading ? (
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="p-8 text-center text-[#8696a0]">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[#d1d7db]" />
                        <h3 className="font-medium mb-2 text-[#3b4a54]">No Assigned Chats</h3>
                        <p className="text-sm">
                            {searchQuery
                                ? 'No assigned chats match your search.'
                                : 'No chats have been assigned to you yet.'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {filteredChats.map((chat: any) => (
                            <div
                                key={`${chat.sessionId}-${chat.chatId}`}
                                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-[#e9edef] hover:bg-[#f5f6f6] ${selectedChat?.chatId === chat.chatId ? 'bg-[#e7f3f0]' : ''
                                    }`}
                                onClick={() => setSelectedChat(chat)}
                            >
                                <div className="relative">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="bg-[#d9fdd3] text-[#3b4a54] text-lg">
                                            {chat.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!chat.isActive && (
                                        <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-[#111b21] truncate">{chat.name}</h3>
                                            {chat.isGroup && <Users className="h-4 w-4 text-[#8696a0]" />}
                                        </div>
                                        {chat.lastMessage && (
                                            <span className="text-xs text-[#8696a0]">
                                                {formatTime(chat.lastMessage.timestamp)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-sm text-[#8696a0] truncate">
                                            {chat.lastMessage ? chat.lastMessage.body : 'No messages yet'}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {chat.unreadCount && chat.unreadCount > 0 && (
                                                <div className="bg-[#00a884] text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                                </div>
                                            )}
                                            {chat.error && (
                                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}