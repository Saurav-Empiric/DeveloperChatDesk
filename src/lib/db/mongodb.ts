import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

// Track the connection status
let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = !!db.connections[0].readyState;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}; 