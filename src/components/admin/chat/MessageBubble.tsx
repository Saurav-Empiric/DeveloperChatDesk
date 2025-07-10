import { formatTime } from "@/lib/utils";

export const MessageBubble = ({
  message,
}: { message: any }) => {

  return (
    <div className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.fromMe
          ? 'bg-green-500 text-white'
          : 'bg-white text-gray-900 shadow-sm'
          }`}
      >
        <p className="text-sm">{message.body}</p>
        <p
          className={`text-xs mt-1 ${message.fromMe ? 'text-green-100' : 'text-gray-500'
            }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
};
