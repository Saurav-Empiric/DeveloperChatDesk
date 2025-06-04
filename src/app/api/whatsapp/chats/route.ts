import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { wahaApi } from '@/lib/waha/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import WhatsAppSession from '@/models/WhatsAppSession';
import ChatAssignment from '@/models/ChatAssignment';
import Developer from '@/models/Developer';

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
    const sessionId = searchParams.get('sessionId') ?? 'default';

    // Find the session in the database
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

    // Check if the user is authorized to access this session
    if (session.user.role === 'admin') {
      // Admin can access any session they created
      if (whatsappSession.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

        // Get all chats from WAHA
        const response = await wahaApi.getChats(sessionId);

        // Get all chat assignments for this session
        const assignments = await ChatAssignment.find({ isActive: true });

        // Create a map of chat IDs to developer IDs
        const chatAssignments = assignments.reduce((map, assignment) => {
          map[assignment.chatId] = assignment.developerId;
          return map;
        }, {} as Record<string, any>);

        // Add assignment information to each chat
        const chats = response.data.map((chat: any) => ({
          ...chat,
          isAssigned: !!chatAssignments[chat.id],
          developerId: chatAssignments[chat.id] || null,
        }));

        return NextResponse.json({ success: true, chats });
      } else if (session.user.role === 'developer') {
        // Developer can only access chats assigned to them
        const developer = await Developer.findOne({ userId: session.user.id });

        if (!developer) {
          return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
        }

        // Get assignments for this developer
        const assignments = await ChatAssignment.find({
          developerId: developer._id,
          isActive: true,
        });

        // Get assigned chat IDs
        const assignedChatIds = assignments.map(assignment => assignment.chatId);

        // Get all chats from WAHA
        const response = await wahaApi.getChats(sessionId);

        // Filter chats to only include those assigned to the developer
        const chats = response.data.filter((chat: any) => 
          assignedChatIds.includes(chat.id)
        );

        return NextResponse.json({ success: true, chats });
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error getting WhatsApp chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 