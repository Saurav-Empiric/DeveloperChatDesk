import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

// Track the connection status
let isConnected = false;

/**
 * Clean up expired reset tokens from User collection
 */
async function cleanupExpiredTokens() {
  try {
    // Only run if connected to the database
    if (mongoose.connection.readyState === 1) {
      const User = mongoose.models.User;
      if (User) {
        // Find users with expired reset tokens and clear them
        await User.updateMany(
          { resetTokenExpires: { $lt: new Date() } },
          { $unset: { resetToken: "", resetTokenExpires: "" } }
        );
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = !!db.connections[0].readyState;
    
    // Run cleanup task for expired tokens
    await cleanupExpiredTokens();
    
    // Schedule cleanup to run periodically (every hour)
    if (typeof window === 'undefined') { // Only run on server side
      setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
} 