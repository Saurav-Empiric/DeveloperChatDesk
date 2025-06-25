import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { connectToDatabase } from '@/lib/db/mongodb';
import ChatAssignment from '@/models/ChatAssignment';
import Developer from '@/models/Developer';

// Create a new assignment
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
    
    const { developerId, chatId, chatName } = await req.json();
    
    if (!developerId || !chatId || !chatName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Check if the developer exists
    const developer = await Developer.findById(developerId);
    
    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }
    
    // Check if the chat is already assigned
    const existingAssignment = await ChatAssignment.findOne({
      chatId,
      isActive: true,
    });
    
    if (existingAssignment) {
      // If assigned to a different developer, update the assignment
      if (existingAssignment.developerId.toString() !== developerId) {
        existingAssignment.isActive = false;
        await existingAssignment.save();
        
        // Create new assignment
        const newAssignment = await ChatAssignment.create({
          developerId,
          chatId,
          chatName,
          assignedAt: new Date(),
          isActive: true,
        });
        
        return NextResponse.json({ 
          success: true, 
          message: 'Chat reassigned successfully', 
          assignment: newAssignment,
          previousAssignment: existingAssignment
        });
      }
      
      // If assigned to the same developer, return existing assignment
      return NextResponse.json({ 
        success: true,
        message: 'Chat is already assigned to this developer',
        assignment: existingAssignment
      });
    }
    
    // Create the assignment
    const assignment = await ChatAssignment.create({
      developerId,
      chatId,
      chatName,
      assignedAt: new Date(),
      isActive: true,
    });
    
    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Error creating chat assignment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Get all assignments
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Get the chatId from query parameters if it exists
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    
    if (session.user.role === 'admin') {
      if (chatId) {
        // If chatId is provided, get assignment for that specific chat
        const assignment = await ChatAssignment.findOne({ 
          chatId, 
          isActive: true 
        }).populate('developerId');
        
        if (!assignment) {
          return NextResponse.json({ 
            success: true, 
            assignment: null, 
            isAssigned: false 
          });
        }
        
        return NextResponse.json({ 
          success: true, 
          assignment, 
          isAssigned: true 
        });
      }
      
      // Admins can see all assignments
      const assignments = await ChatAssignment.find({ isActive: true })
        .populate('developerId')
        .sort({ assignedAt: -1 });
      
      return NextResponse.json({ success: true, assignments });
    } else if (session.user.role === 'developer') {
      // Developers can only see their own assignments
      const developer = await Developer.findOne({ userId: session.user.id });
      
      if (!developer) {
        return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
      }
      
      if (chatId) {
        // If chatId is provided, check if this specific chat is assigned to the developer
        const assignment = await ChatAssignment.findOne({ 
          developerId: developer._id,
          chatId, 
          isActive: true 
        });
        
        if (!assignment) {
          return NextResponse.json({ 
            success: false, 
            error: 'Chat not assigned to you' 
          }, { status: 403 });
        }
        
        return NextResponse.json({ success: true, assignment });
      }
      
      // Get all assignments for this developer
      const assignments = await ChatAssignment.find({
        developerId: developer._id,
        isActive: true,
      }).sort({ assignedAt: -1 });
      
      return NextResponse.json({ success: true, assignments });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error getting chat assignments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Delete an assignment (by setting isActive to false)
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
    
    // Get the assignment ID or chat ID from the query params
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('id');
    const chatId = searchParams.get('chatId');
    const developerId = searchParams.get('developerId');
    
    if (!assignmentId && !chatId) {
      return NextResponse.json({ error: 'Assignment ID or Chat ID is required' }, { status: 400 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    let assignment;
    let chatDetails = null;
    let developerDetails = null;
    
    if (assignmentId) {
      // Deactivate the assignment by ID
      assignment = await ChatAssignment.findByIdAndUpdate(
        assignmentId,
        { isActive: false },
        { new: true }
      ).populate('developerId');

      if (assignment) {
        chatDetails = { 
          id: assignment.chatId, 
          name: assignment.chatName 
        };
      }
    } else if (chatId) {
      // Find the active assignment for this chat
      const existingAssignment = await ChatAssignment.findOne({
        chatId,
        isActive: true,
      }).populate('developerId');

      if (existingAssignment) {
        chatDetails = { 
          id: existingAssignment.chatId, 
          name: existingAssignment.chatName 
        };

        if (existingAssignment.developerId) {
          const developer = await Developer.findById(existingAssignment.developerId)
            .populate('userId');
          
          if (developer) {
            developerDetails = {
              id: developer._id,
              name: developer.userId?.name || 'Unknown',
              email: developer.userId?.email || ''
            };
          }
        }

        // Deactivate the assignment
        assignment = await ChatAssignment.findByIdAndUpdate(
          existingAssignment._id,
          { isActive: false },
          { new: true }
        );
      }
    }
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      unassignedChat: chatId || assignment.chatId,
      chatDetails,
      developerDetails,
      message: developerDetails 
        ? `Successfully unassigned ${developerDetails.name} from this chat` 
        : 'Successfully unassigned this chat'
    });
  } catch (error) {
    console.error('Error deleting chat assignment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 