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
    
    const { sessionId = 'default' } = await req.json();
    
    // Connect to the database
    await connectToDatabase();
    
    try {
      // Check if session exists
      await wahaApi.getSession(sessionId);
    } catch (error) {
      // If session doesn't exist, create it
      await wahaApi.createSession(sessionId);
    }
    
    // Start the WAHA session
    await wahaApi.startSession(sessionId);
    
    // Store the session in the database
    await WhatsAppSession.findOneAndUpdate(
      { sessionId },
      {
        userId: session.user.id,
        isActive: false, // Will be updated when the session is connected
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error('Error starting WhatsApp session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Get the session ID from the query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId')?? 'default';
    try {
      // Get the session status from WAHA
      const response = await wahaApi.getSessionStatus(sessionId);
      const wahaSession = response.data;
      
      // Get the session QR if the status is SCAN_QR
      let qrCode = null;
      if (wahaSession.status === 'SCAN_QR') {
        try {
          const qrResponse = await wahaApi.getSessionQR(sessionId);
          qrCode = qrResponse.data.qr;
        } catch (qrError) {
          console.error('Error getting QR code:', qrError);
        }
      }
      
      return NextResponse.json({
        success: true,
        status: wahaSession.status,
        qrCode,
      });
    } catch (error: any) {
      // If session doesn't exist, return STOPPED status
      if (error.response?.status === 404) {
        return NextResponse.json({
          success: true,
          status: 'STOPPED',
          qrCode: null,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error getting WhatsApp session status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
    
    // Get the session ID from the query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId') || 'default';
    
    // Connect to the database
    await connectToDatabase();
    
    try {
      // Stop the WAHA session
      await wahaApi.stopSession(sessionId);
    } catch (error: any) {
      // If session doesn't exist, just continue
      if (error.response?.status !== 404) {
        throw error;
      }
    }
    
    // Update the session in the database
    await WhatsAppSession.findOneAndUpdate(
      { sessionId },
      { isActive: false }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error stopping WhatsApp session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 