import mongoose, { Document, Schema } from 'mongoose';

export interface IWhatsAppSession extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  isActive: boolean;
  status: string; // Add this line
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppSessionSchema = new Schema<IWhatsAppSession>(
  {
    sessionId: {
      type: String,
      required: [true, 'Please provide a session ID'],
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: 'STOPPED',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.WhatsAppSession || mongoose.model<IWhatsAppSession>('WhatsAppSession', WhatsAppSessionSchema); 