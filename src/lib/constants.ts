  // Query Keys
  export const QUERY_KEYS = {
    SESSIONS: ['whatsapp', 'sessions'],
    CHATS: (sessionId?: string) => ['whatsapp', 'chats', sessionId],
    MESSAGES: (sessionId: string, chatId: string) => ['whatsapp', 'messages', sessionId, chatId],
  } as const;
