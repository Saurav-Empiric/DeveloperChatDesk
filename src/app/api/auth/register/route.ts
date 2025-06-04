import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { name, email, password } = await req.json();
    
    // Validate the input
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Check if registration is allowed (no admin exists yet)
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    if (adminCount > 0) {
      return NextResponse.json({ error: 'Registration is not allowed. An admin already exists.' }, { status: 403 });
    }
    
    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 10);
    
    // Create the admin user
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registering admin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 