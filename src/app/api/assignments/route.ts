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

    const { developerId, chatId, chatSerializedId, chatName, sessionId } = await req.json();

    if (!developerId || !chatId || !chatName || !sessionId || !chatSerializedId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Connect to the database
    await connectToDatabase();

    // Check if the developer exists
    const developer = await Developer.findById(developerId);

    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    // Check if this specific assignment already exists for this session
    const existingAssignment = await ChatAssignment.findOne({
      chatId,
      chatSerializedId,
      developerId,
      sessionId,
    });

    if (existingAssignment) {
      return NextResponse.json({
        success: true,
        message: 'Chat is already assigned to this developer in this session',
        assignment: existingAssignment
      });
    }

    // Create the assignment (multiple developers can now be assigned to the same chat)
    const assignment = await ChatAssignment.create({
      developerId,
      chatId,
      chatSerializedId,
      chatName,
      sessionId,
      assignedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Chat assigned successfully',
      assignment
    });
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

    // Get the chatId and sessionId from query parameters if they exist
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const developerId = searchParams.get('developerId');
    const sessionId = searchParams.get('sessionId');

    if (session.user.role === 'admin') {
      if (chatId) {
        // If chatId is provided, get all assignments for that specific chat and session
        const query: any = { chatId };
        if (sessionId) {
          query.sessionId = sessionId;
        }
        
        const assignments = await ChatAssignment.find(query)
          .populate('developerId');

        return NextResponse.json({
          success: true,
          assignments,
          isAssigned: assignments.length > 0
        });
      }

      if (developerId) {
        // If developerId is provided, get all assignments for that developer and session
        const query: any = { developerId };
        if (sessionId) {
          query.sessionId = sessionId;
        }
        
        const assignments = await ChatAssignment.find(query)
          .sort({ assignedAt: -1 });

        return NextResponse.json({ success: true, assignments });
      }

      // Admins can see assignments filtered by session if provided
      const query: any = {};
      if (sessionId) {
        query.sessionId = sessionId;
      }
      
      const assignments = await ChatAssignment.find(query)
        .populate({
          path: 'developerId',
          select: 'userId',
          populate: {
            path: 'userId',
            model: 'User',
            select: 'name email',
          },
        })
        .sort({ assignedAt: -1 });

      return NextResponse.json({ success: true, assignments });
    } else if (session.user.role === 'developer') {
      // Developers can only see their own assignments
      const developer = await Developer.findOne({ userId: session.user.id });

      if (!developer) {
        return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
      }

      if (chatId) {
        // If chatId is provided, check if this specific chat is assigned to the developer in the session
        const query: any = {
          developerId: developer._id,
          chatId
        };
        if (sessionId) {
          query.sessionId = sessionId;
        }
        
        const assignment = await ChatAssignment.findOne(query);

        if (!assignment) {
          return NextResponse.json({
            success: false,
            error: 'Chat not assigned to you in this session'
          }, { status: 403 });
        }

        return NextResponse.json({ success: true, assignment });
      }

      // Get all assignments for this developer, filtered by session if provided
      const query: any = {
        developerId: developer._id
      };
      if (sessionId) {
        query.sessionId = sessionId;
      }
      
      const assignments = await ChatAssignment.find(query).sort({ assignedAt: -1 });

      return NextResponse.json({ success: true, assignments });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error getting chat assignments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Delete an assignment
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
    const sessionId = searchParams.get('sessionId');

    if (!assignmentId && !chatId) {
      return NextResponse.json({
        error: 'Either assignment ID or chatId is required'
      }, { status: 400 });
    }

    // Connect to the database
    await connectToDatabase();

    let assignment;
    let chatDetails = null;
    let developerDetails = null;

    if (assignmentId) {
      // Delete the assignment by ID
      assignment = await ChatAssignment.findByIdAndDelete(assignmentId)
        .populate('developerId');

      if (assignment) {
        chatDetails = {
          id: assignment.chatId,
          name: assignment.chatName
        };
      }
    } else if (chatId) {
      if (developerId) {
        // Delete specific assignment for this chat and developer
        const query: any = {
          chatId,
          developerId
        };
        if (sessionId) {
          query.sessionId = sessionId;
        }
        
        assignment = await ChatAssignment.findOneAndDelete(query).populate('developerId');

        if (assignment) {
          chatDetails = {
            id: assignment.chatId,
            name: assignment.chatName
          };

          // Get developer details
          const developer = await Developer.findById(developerId)
            .populate('userId');

          if (developer) {
            developerDetails = {
              id: developer._id,
              name: developer.userId?.name || 'Unknown',
              email: developer.userId?.email || ''
            };
          }
        }
      } else {
        // Delete all assignments for this chat
        const query: any = { chatId };
        if (sessionId) {
          query.sessionId = sessionId;
        }
        
        const deletedAssignments = await ChatAssignment.find(query)
          .populate('developerId');

        if (deletedAssignments.length > 0) {
          // Get chat details from the first assignment
          chatDetails = {
            id: deletedAssignments[0].chatId,
            name: deletedAssignments[0].chatName
          };

          // Delete all assignments
          await ChatAssignment.deleteMany(query);
          
          // Set a flag to indicate multiple deletions
          assignment = { _id: 'multiple', chatId, chatName: deletedAssignments[0].chatName };
        }
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