import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { wahaApi } from '@/lib/waha/api';
import WhatsAppSession from '@/models/WhatsAppSession';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Connect to the database
    await connectToDatabase();

    // Fetch WhatsApp sessions for this admin from MongoDB
    const dbSessions = await WhatsAppSession.find({ userId: session.user.id });
    return NextResponse.json({
      success: true,
      sessions: dbSessions.map((s: any) => ({
        id: s.sessionId,
        name: s.sessionId,
        status: s.status,
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))
    });
  } catch (error) {
    console.error('Error getting WhatsApp sessions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 