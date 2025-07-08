import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { wahaApi } from '@/lib/waha/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import WhatsAppSession from '@/models/WhatsAppSession';
import ChatAssignment from '@/models/ChatAssignment';
import Developer from '@/models/Developer';

// Send a message
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    const { chatId, text, sessionId = 'default' } = await req.json();
    if (!chatId || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the session
    let whatsappSession = await WhatsAppSession.findOne({ sessionId });
    
    // If session not found in DB but user is admin, check if it exists in WAHA
    if (!whatsappSession && session.user.role === 'admin') {
      try {
        // Check if session exists in WAHA
        const wahaSessionResponse = await wahaApi.getSessionStatus(sessionId);
        if (wahaSessionResponse.data.status === 'WORKING' || wahaSessionResponse.data.status === 'CONNECTED') {
          // Create the session in MongoDB
          whatsappSession = await WhatsAppSession.create({
            sessionId,
            userId: session.user.id,
            isActive: true,
          });
        }
      } catch (error) {
        // Session doesn't exist in WAHA either
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    }
    
    if (!whatsappSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user is authorized to send messages in this chat
    if (session.user.role === 'admin') {
      // Admin can send messages to any chat in their session
      if (whatsappSession.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role === 'developer') {
      // Developer can only send messages to assigned chats
      const developer = await Developer.findOne({ userId: session.user.id });

      if (!developer) {
        return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
      }

      // Check if this chat is assigned to the developer in this session
      const assignment = await ChatAssignment.findOne({
        developerId: developer._id,
        chatId,
        sessionId,
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Chat not assigned to you in this session' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Send the message
    const response = await wahaApi.sendTextMessage(sessionId, chatId, text);

    return NextResponse.json({
      success: true,
      message: response.data,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Get messages for a chat
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get chat ID and session ID from the query params
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const sessionId = searchParams.get('sessionId') ?? 'default';
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Find the session
    let whatsappSession = await WhatsAppSession.findOne({ sessionId });
    
    // If session not found in DB but user is admin, check if it exists in WAHA
    if (!whatsappSession && session.user.role === 'admin') {
      try {
        // Check if session exists in WAHA
        const wahaSessionResponse = await wahaApi.getSessionStatus(sessionId);
        if (wahaSessionResponse.data.status === 'WORKING' || wahaSessionResponse.data.status === 'CONNECTED') {
          // Create the session in MongoDB
          whatsappSession = await WhatsAppSession.create({
            sessionId,
            userId: session.user.id,
            isActive: true,
          });
        }
      } catch (error) {
        // Session doesn't exist in WAHA either
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    }
    
    if (!whatsappSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user is authorized to view messages in this chat
    if (session.user.role === 'admin') {
      // Admin can view messages in any chat in their session
      if (whatsappSession.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role === 'developer') {
      // Developer can only view messages in assigned chats
      const developer = await Developer.findOne({ userId: session.user.id });

      if (!developer) {
        return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
      }

      // Check if this chat is assigned to the developer in this session
      const assignment = await ChatAssignment.findOne({
        developerId: developer._id,
        chatId,
        sessionId,
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Chat not assigned to you in this session' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Determine the chat type
    const chatType = wahaApi.determineChatType(chatId);
    // Get the messages with pagination
    const response = await wahaApi.getChatMessages(sessionId, chatId, limit, offset);

    return NextResponse.json({
      success: true,
      messages: response.data,
      chatType: chatType,
      pagination: {
        limit,
        offset,
        hasMore: response.data.length === limit // If we got exactly the limit number of messages, there might be more
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 