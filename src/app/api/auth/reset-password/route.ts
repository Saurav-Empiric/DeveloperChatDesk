import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';

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
    
    const { token, email, password } = data;
    
    // Validate the input
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token is required' 
      }, { status: 400 });
    }
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    if (!password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Password is required' 
      }, { status: 400 });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the user and check if the token is valid
    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }, // Check if the token hasn't expired
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired reset link. Please request a new one.' 
      }, { status: 400 });
    }
    
    try {
      // Hash the new password
      const hashedPassword = await hash(password, 10);
      
      // Update the user's password and clear the reset token
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { password: hashedPassword },
          $unset: { resetToken: "", resetTokenExpires: "" }
        }
      );
      
      return NextResponse.json({ 
        success: true,
        message: 'Your password has been reset successfully.'
      });
      
    } catch (error) {
      console.error('Error updating password:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update password. Please try again.' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred. Please try again later.' 
    }, { status: 500 });
  }
} 