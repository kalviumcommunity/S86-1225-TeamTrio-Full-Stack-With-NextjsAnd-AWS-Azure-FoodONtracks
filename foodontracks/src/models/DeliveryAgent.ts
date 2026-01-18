import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliveryAgent extends Document {
  userId: mongoose.Types.ObjectId; // Reference to User with DELIVERY_GUY role
  
  // Vehicle information
  vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'VAN' | 'CYCLE';
  vehicleNumber?: string;
  
  // Availability
  isAvailable: boolean;
  currentZone?: string; // Railway zone they're currently serving
  
  // Performance metrics
  totalDeliveries: number;
  successfulDeliveries: number;
  cancelledDeliveries: number;
  averageRating: number;
  
  // Status
  isVerified: boolean;
  isActive: boolean;
  
  // Documents
  documents: {
    type: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'RC_BOOK';
    documentNumber: string;
    verified: boolean;
    uploadedAt: Date;
  }[];
  
  // Work history
  joinedAt: Date;
  lastActiveAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryAgentSchema = new Schema<IDeliveryAgent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['BIKE', 'SCOOTER', 'CAR', 'VAN', 'CYCLE'],
      required: true,
    },
    vehicleNumber: String,
    
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    currentZone: {
      type: String,
      index: true,
    },
    
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    successfulDeliveries: {
      type: Number,
      default: 0,
    },
    cancelledDeliveries: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    documents: [
      {
        type: {
          type: String,
          enum: ['AADHAAR', 'PAN', 'DRIVING_LICENSE', 'RC_BOOK'],
          required: true,
        },
        documentNumber: { type: String, required: true },
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
DeliveryAgentSchema.index({ isAvailable: 1, currentZone: 1 });
DeliveryAgentSchema.index({ isVerified: 1, isActive: 1 });

export const DeliveryAgent =
  mongoose.models.DeliveryAgent || mongoose.model<IDeliveryAgent>('DeliveryAgent', DeliveryAgentSchema);
