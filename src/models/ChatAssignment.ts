import mongoose, { Document, Schema } from 'mongoose';

export interface IChatAssignment extends Document {
  developerId: mongoose.Types.ObjectId;
  chatId: string;
  chatName: string;
  assignedAt: Date;
  isActive: boolean;
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure a chat can only be assigned to one developer
ChatAssignmentSchema.index({ chatId: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export default mongoose.models.ChatAssignment || mongoose.model<IChatAssignment>('ChatAssignment', ChatAssignmentSchema); 