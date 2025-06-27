import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { connectToDatabase } from '@/lib/db/mongodb';
import ChatAssignment from '@/models/ChatAssignment';
import Developer from '@/models/Developer';
import WhatsAppSession from '@/models/WhatsAppSession';
import { wahaApi } from '@/lib/waha/api';

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only developers can access this endpoint
    if (session.user.role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Connect to the database
    await connectToDatabase();

    // Find the developer record
    const developer = await Developer.findOne({ userId: session.user.id });

    if (!developer) {
      console.error('Developer not found for userId:', session.user.id);
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    // Get all assignments for this developer
    const assignments = await ChatAssignment.find({
      developerId: developer._id
    }).sort({ assignedAt: -1 });

    if (assignments.length === 0) {
      // Let's also check if there are any assignments at all
      const allAssignments = await ChatAssignment.find({}).limit(5);
      
      return NextResponse.json({ 
        success: true, 
        chats: [],
        debug: {
          developerId: developer._id.toString(),
          userId: session.user.id,
          totalAssignments: allAssignments.length
        }
      });
    }

    // Group assignments by session
    const assignmentsBySession: Record<string, any[]> = {};
    assignments.forEach(assignment => {
      const sessionId = assignment.sessionId;
      if (!assignmentsBySession[sessionId]) {
        assignmentsBySession[sessionId] = [];
      }
      assignmentsBySession[sessionId].push(assignment);
    });

    const enrichedChats = [];

    // For each session, fetch the WhatsApp chat details
    for (const [sessionId, sessionAssignments] of Object.entries(assignmentsBySession)) {
      try {
        // Check if session exists and is active
        const whatsappSession = await WhatsAppSession.findOne({ sessionId });
        
        if (!whatsappSession || !whatsappSession.isActive) {
          console.warn(`Session ${sessionId} not found or inactive`);
          continue;
        }

        // Get all chats from WAHA for this session
        const wahaResponse = await wahaApi.getChats(sessionId);
        const allWhatsAppChats = wahaResponse.data || [];

        // Create a map of chatId to WhatsApp chat details
        const whatsappChatMap = allWhatsAppChats.reduce((map: any, chat: any) => {
          map[chat.id] = chat;
          return map;
        }, {});

        // Enrich each assignment with WhatsApp chat details
        for (const assignment of sessionAssignments) {
          const whatsappChat = whatsappChatMap[assignment.chatId];
          
          if (whatsappChat) {
            enrichedChats.push({
              // Assignment details
              assignmentId: assignment._id,
              chatId: assignment.chatId,
              chatName: assignment.chatName,
              sessionId: assignment.sessionId,
              assignedAt: assignment.assignedAt,
              
              // WhatsApp chat details
              id: whatsappChat.id,
              name: whatsappChat.name || assignment.chatName,
              isGroup: whatsappChat.isGroup || false,
              lastMessage: whatsappChat.lastMessage || null,
              
              // Session details
              sessionName: whatsappSession.sessionId, // You can enhance this with actual session name if stored
              
              // Additional metadata
              isActive: true,
              unreadCount: 0 // This could be enhanced later with actual unread count
            });
          } else {
            // Chat not found in WhatsApp (maybe deleted), but keep assignment info
            enrichedChats.push({
              // Assignment details
              assignmentId: assignment._id,
              chatId: assignment.chatId,
              chatName: assignment.chatName,
              sessionId: assignment.sessionId,
              assignedAt: assignment.assignedAt,
              
              // Default values when WhatsApp chat not found
              id: { user: assignment.chatId, server: 'c.us', _serialized: assignment.chatId },
              name: assignment.chatName,
              isGroup: false,
              lastMessage: null,
              
              // Session details
              sessionName: whatsappSession.sessionId,
              
              // Additional metadata
              isActive: false, // Mark as inactive since not found in WhatsApp
              unreadCount: 0
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching WhatsApp chats for session ${sessionId}:`, error);
        
        // If WhatsApp API fails, still include assignment info without WhatsApp details
        for (const assignment of sessionAssignments) {
          enrichedChats.push({
            // Assignment details
            assignmentId: assignment._id,
            chatId: assignment.chatId,
            chatName: assignment.chatName,
            sessionId: assignment.sessionId,
            assignedAt: assignment.assignedAt,
            
            // Default values when WhatsApp API fails
            id: { user: assignment.chatId, server: 'c.us', _serialized: assignment.chatId },
            name: assignment.chatName,
            isGroup: false,
            lastMessage: null,
            
            // Session details
            sessionName: sessionId,
            
            // Additional metadata
            isActive: false, // Mark as inactive due to API error
            unreadCount: 0,
            error: 'WhatsApp API unavailable'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      chats: enrichedChats
    });

  } catch (error) {
    console.error('Error fetching developer chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 