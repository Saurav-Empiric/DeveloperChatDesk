import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/services/emailService';
import Developer from '@/models/Developer';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    let data;
    try {
      data = await req.json();
    } catch (e) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request body' 
      }, { status: 400 });
    }
    
    const { email, role } = data;
    
    // Validate email
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email format' 
      }, { status: 400 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Check if the user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      // Return clear error that user doesn't exist
      return NextResponse.json({ 
        success: false, 
        error: 'No account found with this email address' 
      }, { status: 404 });
    }
    
    // Verify the role if provided
    if (role && user.role !== role) {
      return NextResponse.json({ 
        success: false, 
        error: `This email is not registered as a ${role}` 
      }, { status: 400 });
    }
    
    // Get additional user information if needed
    let resetPagePath = '/reset-password';
    if (user.role === 'developer') {
      // For developers, use the developer reset page
      resetPagePath = '/developer/reset-password';
    }
    
    // Generate a reset token
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour
    
    // Save the token directly to the user document
    await User.updateOne(
      { _id: user._id },
      { 
        resetToken: token,
        resetTokenExpires: expires
      }
    );
    
    // Build the reset link
    // Use environment variable for the base URL or fallback to localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const resetLink = `${baseUrl}${resetPagePath}?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Send the password reset email
    const emailResult = await sendPasswordResetEmail(email, resetLink, user.name, user.role);
    
    if (!emailResult) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send password reset email. Please try again or contact support.' 
      }, { status: 500 });
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Password reset email sent successfully. Please check your inbox.'
    });
    
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred. Please try again later.' 
    }, { status: 500 });
  }
} 