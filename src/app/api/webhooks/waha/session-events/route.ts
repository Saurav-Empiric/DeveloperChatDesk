// app/api/waha-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import WhatsAppSession from '@/models/WhatsAppSession';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { event, session: sessionId, payload: innerPayload } = payload;
    const status = innerPayload?.status ?? 'UNKNOWN';

    await connectToDatabase();

    if (event === 'session.status') {
      await handleSessionStatusChange(sessionId, status);
      return NextResponse.json({ success: true });
    } else {
      const msg = `Unhandled event: ${event}`;
      console.warn(msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling WAHA webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function handleSessionStatusChange(sessionId: string, status: string) {
  const isActive = status === 'WORKING' || status === 'CONNECTED';

  const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  if (!adminUser) {
    console.warn(`No admin user found for session ${sessionId}`);
    return;
  }

  await WhatsAppSession.findOneAndUpdate(
    { sessionId },
    { sessionId, userId: adminUser._id, status, isActive },
    { upsert: true, new: true }
  );
}

async function handleSessionConnected(sessionId: string) {
  const status = 'WORKING';
  const isActive = true;

  const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  if (!adminUser) {
    console.warn(`No admin user found for session ${sessionId}`);
    return;
  }

  await WhatsAppSession.findOneAndUpdate(
    { sessionId },
    { sessionId, userId: adminUser._id, status, isActive },
    { upsert: true, new: true }
  );
}

async function handleSessionDisconnected(sessionId: string) {
  const status = 'STOPPED';
  const isActive = false;

  const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  if (!adminUser) {
    console.warn(`No admin user found for session ${sessionId}`);
    return;
  }

  await WhatsAppSession.findOneAndUpdate(
    { sessionId },
    { sessionId, userId: adminUser._id, status, isActive },
    { upsert: true, new: true }
  );
}
