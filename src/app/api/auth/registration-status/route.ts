import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Check if any admin user exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    // Registration is allowed only if there are no admin users
    const canRegister = adminCount === 0;
    
    return NextResponse.json({ canRegister });
  } catch (error) {
    console.error('Error checking registration status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 