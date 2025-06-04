import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { wahaApi } from '@/lib/waha/api';

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('server session: ', session)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get all sessions from WAHA
    const response = await wahaApi.getSessions();
    
    // Filter sessions that are running/connected
    const sessions = response.data.filter((session: any) => 
      session.status === 'WORKING' || session.status === 'CONNECTED' || session.status === 'STARTING'
    );
    return NextResponse.json({ 
      success: true, 
      sessions: sessions.map((session: any) => ({
        id: session.name,
        name: session.name,
        status: session.status,
        config: session.config,
        me: session.me // Contains phone number and name info
      }))
    });
  } catch (error) {
    console.error('Error getting WhatsApp sessions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 