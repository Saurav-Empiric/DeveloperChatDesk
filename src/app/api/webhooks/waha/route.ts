import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import WhatsAppSession from '@/models/WhatsAppSession';
import ChatAssignment from '@/models/ChatAssignment';

export async function POST(req: NextRequest) {
  try {
    // Parse the webhook payload
    const payload = await req.json();
    
    // Extract relevant information
    const { event, session, data } = payload;
    
    // Connect to the database
    await connectToDatabase();
    
    // Handle different webhook events
    switch (event) {
      case 'message': 
        // This event is triggered when a new message is received
        await handleIncomingMessage(session, data);
        break;
      
      case 'state_change':
        // This event is triggered when the session state changes
        await handleSessionStateChange(session, data);
        break;
        
      // Handle other events as needed
      
      default:
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function handleIncomingMessage(sessionId: string, data: any) {
  // Find the session in the database
  const session = await WhatsAppSession.findOne({ sessionId });
  
  if (!session) {
    console.error(`Session not found: ${sessionId}`);
    return;
  }
  
  // Extract chat ID from the message
  const chatId = data.from;
  
  // Find if this chat is assigned to a developer
  const assignment = await ChatAssignment.findOne({
    chatId,
    isActive: true,
  }).populate('developerId');
  
  if (assignment) {
    // Here you would send a notification to the developer
    // This could be through WebSockets, push notifications, etc.
    console.log(`Message received for developer ${assignment.developerId}: ${data.body}`);
    
    // For real-time notifications, you could use a WebSocket connection or similar
  } else {
    // Chat is not assigned to any developer
    console.log(`Unassigned chat message received: ${data.body}`);
  }
}

async function handleSessionStateChange(sessionId: string, data: any) {
  // Update session status in the database
  await WhatsAppSession.findOneAndUpdate(
    { sessionId },
    { isActive: data.status === 'CONNECTED' }
  );
  
  console.log(`Session ${sessionId} state changed to ${data.status}`);
} 