import mongoose, { Document, Schema } from 'mongoose';

export interface IChatAssignment extends Document {
  developerId: mongoose.Types.ObjectId;
  chatId: string;
  chatName: string;
  assignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatAssignmentSchema = new Schema<IChatAssignment>(
  {
    developerId: {
      type: Schema.Types.ObjectId,
      ref: 'Developer',
      required: [true, 'Please provide a developer ID'],
    },
    chatId: {
      type: String,
      required: [true, 'Please provide a chat ID'],
    },
    chatName: {
      type: String,
      required: [true, 'Please provide a chat name'],
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for efficient querying by chatId and developerId
ChatAssignmentSchema.index({ chatId: 1, developerId: 1 });

export default mongoose.models.ChatAssignment || mongoose.model<IChatAssignment>('ChatAssignment', ChatAssignmentSchema); 