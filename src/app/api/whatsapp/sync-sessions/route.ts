import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { wahaApi } from '@/lib/waha/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import WhatsAppSession from '@/models/WhatsAppSession';

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure user is an admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Get all sessions from WAHA
    const response = await wahaApi.getSessions();
    const wahaSessions = response.data;
    
    // Get all sessions from MongoDB for this admin
    const dbSessions = await WhatsAppSession.find({ userId: session.user.id });
    const dbSessionIds = dbSessions.map(s => s.sessionId);
    
    // Find sessions that exist in WAHA but not in MongoDB
    const newSessions = wahaSessions.filter((wahaSession: any) => 
      !dbSessionIds.includes(wahaSession.name) && 
      (wahaSession.status === 'WORKING' || wahaSession.status === 'CONNECTED' || wahaSession.status === 'STARTING')
    );
    
    // Remove logic that creates WhatsAppSession in the DB
    // Only return the WAHA sessions for reference
    return NextResponse.json({ success: true, message: 'WAHA sessions fetched. DB is updated via webhook.' });
  } catch (error) {
    console.error('Error syncing WhatsApp sessions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 