import mongoose, { Schema, Model } from 'mongoose';

export interface IFile {
  _id?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  uploadedBy: mongoose.Types.ObjectId;
  folder?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const FileSchema = new Schema<IFile>(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    cloudinaryUrl: {
      type: String,
    },
    cloudinaryPublicId: {
      type: String,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folder: {
      type: String,
      default: 'foodontracks',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FileSchema.index({ uploadedBy: 1 });
FileSchema.index({ filename: 1 });
FileSchema.index({ createdAt: -1 });

export const File: Model<IFile> = 
  mongoose.models.File || mongoose.model<IFile>('File', FileSchema);
