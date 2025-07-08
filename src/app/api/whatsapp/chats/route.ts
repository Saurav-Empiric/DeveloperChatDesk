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

    // Get the session ID and pagination params from the query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId') ?? 'default';
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

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

      // Get paginated chats from WAHA
      const response = await wahaApi.getChats(sessionId, limit, offset);

      // Get all chat assignments for this specific session
      const assignments = await ChatAssignment.find({ 
        sessionId: sessionId 
      }).populate('developerId');

      // Create a map of chat IDs to assignments with developer details
      const chatAssignments = assignments.reduce((map, assignment) => {
        map[assignment.chatId] = {
          id: assignment._id,
          developerId: assignment.developerId._id,
          developer: assignment.developerId ? {
            name: assignment.developerId.userId?.name || 'Unknown',
            email: assignment.developerId.userId?.email || ''
          } : null
        };
        return map;
      }, {} as Record<string, any>);

      // Add assignment information to each chat
      const chats = response.data.map((chat: any) => {
        const assignment = chatAssignments[chat.id];
        return {
          ...chat,
          isAssigned: !!assignment,
          developerId: assignment ? assignment.developerId : null,
          developer: assignment ? assignment.developer : null
        };
      });

      // Return the chats with pagination metadata
      return NextResponse.json({ 
        success: true, 
        chats,
        pagination: {
          limit,
          offset,
          hasMore: chats.length === limit // If we got exactly the limit number of chats, there might be more
        }
      });
    } else if (session.user.role === 'developer') {
      // Developer can only access chats assigned to them
      const developer = await Developer.findOne({ userId: session.user.id });

      if (!developer) {
        return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
      }

      // Get assignments for this developer in the specific session
      const assignments = await ChatAssignment.find({
        developerId: developer._id,
        sessionId: sessionId,
      });

      // Get assigned chat IDs
      const assignedChatIds = assignments.map(assignment => assignment.chatId);

      // Get paginated chats from WAHA
      const response = await wahaApi.getChats(sessionId, limit, offset);

      // Filter chats to only include those assigned to the developer
      const chats = response.data.filter((chat: any) => 
        assignedChatIds.includes(chat.id)
      );

      // Return the chats with pagination metadata
      return NextResponse.json({ 
        success: true, 
        chats,
        pagination: {
          limit,
          offset,
          hasMore: response.data.length === limit && chats.length > 0 // Check if there might be more chats
        }
      });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error getting WhatsApp chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 