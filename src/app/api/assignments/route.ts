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
      return NextResponse.json({ 
        error: 'Chat is already assigned to a developer',
        currentAssignment: existingAssignment
      }, { status: 400 });
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
    
    if (session.user.role === 'admin') {
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
    
    // Get the assignment ID from the query params
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('id');
    
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Deactivate the assignment
    const assignment = await ChatAssignment.findByIdAndUpdate(
      assignmentId,
      { isActive: false },
      { new: true }
    );
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat assignment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 