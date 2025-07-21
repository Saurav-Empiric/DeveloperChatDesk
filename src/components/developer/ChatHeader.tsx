import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const DeveloperChatHeader = ({selectedChat}: {selectedChat: any}) => {
    return (
        <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 border-b border-[#e9edef]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[#d9fdd3] text-[#3b4a54]">
                      {selectedChat.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium text-[#111b21]">{selectedChat.name}</h2>
                    <div className="flex items-center gap-2 text-xs text-[#8696a0]">
                      <span>{selectedChat.sessionName}</span>
                      <span>•</span>
                      {selectedChat.isActive ? (
                        <span className="text-[#00a884]">• Online</span>
                      ) : (
                        <span className="text-red-400">• Offline</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
    )
}