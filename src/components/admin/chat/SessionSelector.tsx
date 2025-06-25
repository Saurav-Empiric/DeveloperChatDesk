import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone } from 'lucide-react';
import { type WhatsAppSession } from '@/services/whatsappService';

interface SessionSelectorProps {
  sessions: WhatsAppSession[];
  selectedSession: string;
  onSessionChange: (sessionId: string) => void;
}

export const SessionSelector = ({ 
  sessions, 
  selectedSession, 
  onSessionChange 
}: SessionSelectorProps) => {
  if (sessions.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      <Select value={selectedSession} onValueChange={onSessionChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select WhatsApp Account" />
        </SelectTrigger>
        <SelectContent>
          {sessions.map((session: WhatsAppSession) => (
            <SelectItem key={session.id} value={session.id}>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{session.me?.pushName ?? session.name}</span>
                <Badge variant={session.status === 'WORKING' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}; 