import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import WhatsAppSession from '@/models/WhatsAppSession';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    // Parse the webhook payload
    const payload = await req.json();

    // Extract relevant information
    const { event, session: sessionId, data } = payload;

    // Connect to the database
    await connectToDatabase();

    // Handle different webhook events
    switch (event) {
      case 'session.status':
        await handleSessionStatusChange(sessionId, data);
        break;

      case 'session.authenticated':
        await handleSessionAuthenticated(sessionId, data);
        break;

      case 'session.disconnected':
        await handleSessionDisconnected(sessionId, data);
        break;

      default:
        console.log(`Unhandled session event: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling session webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function handleSessionStatusChange(sessionId: string, data: any) {
  const isActive = data.status === 'WORKING' || data.status === 'CONNECTED';

  // Check if session exists in database
  const existingSession = await WhatsAppSession.findOne({ sessionId });

  if (existingSession) {
    // Update existing session
    await WhatsAppSession.findByIdAndUpdate(
      existingSession._id,
      { isActive }
    );
  } else if (isActive) {
    // Session is active but not in database
    // Try to find an admin user to associate with this session
    const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });

    if (adminUser) {
      // Create new session associated with the first admin
      await WhatsAppSession.create({
        sessionId,
        userId: adminUser._id,
        isActive: true,
      });
    } else {
      console.warn(`No admin user found to associate with session ${sessionId}`);
    }
  }
}

async function handleSessionAuthenticated(sessionId: string, data: any) {
  // Session has been authenticated (QR code scanned)
  const existingSession = await WhatsAppSession.findOne({ sessionId });

  if (existingSession) {
    await WhatsAppSession.findByIdAndUpdate(
      existingSession._id,
      { isActive: true }
    );
  } else {
    // Try to find an admin user to associate with this session
    const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });

    if (adminUser) {
      await WhatsAppSession.create({
        sessionId,
        userId: adminUser._id,
        isActive: true,
      });
    }
  }
}

async function handleSessionDisconnected(sessionId: string, data: any) {
  // Session has been disconnected
  await WhatsAppSession.findOneAndUpdate(
    { sessionId },
    { isActive: false }
  );
  
} 