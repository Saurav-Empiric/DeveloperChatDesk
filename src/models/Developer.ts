import mongoose, { Document, Schema } from 'mongoose';

export interface IDeveloper extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DeveloperSchema = new Schema<IDeveloper>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
      unique: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to the admin user
      required: [true, 'Please provide an organization ID'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Developer || mongoose.model<IDeveloper>('Developer', DeveloperSchema); 