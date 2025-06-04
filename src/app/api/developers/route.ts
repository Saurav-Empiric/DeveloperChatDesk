import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { hash } from 'bcrypt';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';
import Developer from '@/models/Developer';
import ChatAssignment from '@/models/ChatAssignment';

// Create a new developer
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
    
    const { name, email, password } = await req.json();
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 10);
    
    // Create the user with developer role
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'developer',
    });
    
    // Create the developer profile
    const developer = await Developer.create({
      userId: user._id,
      organizationId: session.user.id, // Admin is the organization
    });
    
    return NextResponse.json({ 
      success: true,
      developer: {
        ...developer.toObject(),
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Error creating developer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Get all developers
export async function GET(req: NextRequest) {
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
    
    // Connect to the database
    await connectToDatabase();
    
    // Get all developers for this admin/organization
    const developers = await Developer.find({ organizationId: session.user.id })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, developers });
  } catch (error) {
    console.error('Error getting developers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Delete a developer
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
    
    // Get the developer ID from the query params
    const { searchParams } = new URL(req.url);
    const developerId = searchParams.get('id');
    
    if (!developerId) {
      return NextResponse.json({ error: 'Developer ID is required' }, { status: 400 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the developer
    const developer = await Developer.findById(developerId);
    
    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }
    
    // Ensure the developer belongs to this admin/organization
    if (developer.organizationId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete all chat assignments for this developer
    await ChatAssignment.updateMany(
      { developerId: developer._id, isActive: true },
      { isActive: false }
    );
    
    // Delete the developer and user
    await Developer.findByIdAndDelete(developerId);
    await User.findByIdAndDelete(developer.userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting developer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 