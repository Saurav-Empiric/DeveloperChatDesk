import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, RefreshCw } from 'lucide-react';
import { type WhatsAppSession } from '@/services/whatsappService';

interface SessionSelectorProps {
  sessions: WhatsAppSession[];
  selectedSession: string;
  onSessionChange: (sessionId: string) => void;
  isLoading?: boolean;
  onRefreshSessions?: () => void;
}

export const SessionSelector = ({ 
  sessions, 
  selectedSession, 
  onSessionChange,
  isLoading = false,
  onRefreshSessions
}: SessionSelectorProps) => {
  if (sessions.length === 0 && !isLoading) return null;

  return (
    <div className="flex items-center gap-4">
      <Select value={selectedSession} onValueChange={onSessionChange} disabled={isLoading}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder={isLoading ? "Loading sessions..." : "Select WhatsApp Account"} />
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
      
      {onRefreshSessions && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefreshSessions}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      )}
    </div>
  );
}; 