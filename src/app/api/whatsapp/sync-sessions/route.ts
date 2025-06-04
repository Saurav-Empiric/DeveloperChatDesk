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
    
    // Create records for new sessions
    const createdSessions = [];
    for (const wahaSession of newSessions) {
      const newSession = await WhatsAppSession.create({
        sessionId: wahaSession.name,
        userId: session.user.id,
        isActive: wahaSession.status === 'WORKING' || wahaSession.status === 'CONNECTED',
      });
      createdSessions.push(newSession);
    }
    
    // Update status for existing sessions
    for (const dbSession of dbSessions) {
      const wahaSession = wahaSessions.find((s: any) => s.name === dbSession.sessionId);
      if (wahaSession) {
        const isActive = wahaSession.status === 'WORKING' || wahaSession.status === 'CONNECTED';
        if (dbSession.isActive !== isActive) {
          await WhatsAppSession.findByIdAndUpdate(dbSession._id, { isActive });
        }
      } else {
        // Session exists in DB but not in WAHA, mark as inactive
        if (dbSession.isActive) {
          await WhatsAppSession.findByIdAndUpdate(dbSession._id, { isActive: false });
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      syncedSessions: createdSessions.length,
      totalSessions: wahaSessions.length,
      message: `Synced ${createdSessions.length} new sessions`
    });
  } catch (error) {
    console.error('Error syncing WhatsApp sessions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 