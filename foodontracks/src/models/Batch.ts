import mongoose, { Document, Schema } from 'mongoose';

export type BatchStatus =
  | 'PREPARED'
  | 'PACKED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface IBatch extends Document {
  batchNumber: string;
  restaurantId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  deliveryGuyId?: mongoose.Types.ObjectId;
  
  status: BatchStatus;
  
  // Lifecycle timestamps
  preparedAt?: Date;
  packedAt?: Date;
  pickedUpAt?: Date;
  inTransitAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  
  // Tracking details
  items: {
    name: string;
    quantity: number;
    temperature?: number; // For temperature-sensitive items
  }[];
  
  // Quality checks
  qualityChecks: {
    timestamp: Date;
    checkedBy: mongoose.Types.ObjectId; // User who performed check
    status: 'PASSED' | 'FAILED';
    notes?: string;
  }[];
  
  // Delivery location tracking
  currentLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: Date;
  };
  
  // Metadata
  notes?: string;
  cancelReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    batchNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    deliveryGuyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['PREPARED', 'PACKED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
      default: 'PREPARED',
      required: true,
      index: true,
    },
    
    // Lifecycle timestamps
    preparedAt: Date,
    packedAt: Date,
    pickedUpAt: Date,
    inTransitAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        temperature: Number,
      },
    ],
    
    qualityChecks: [
      {
        timestamp: { type: Date, required: true },
        checkedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['PASSED', 'FAILED'], required: true },
        notes: String,
      },
    ],
    
    currentLocation: {
      latitude: Number,
      longitude: Number,
      updatedAt: Date,
    },
    
    notes: String,
    cancelReason: String,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
BatchSchema.index({ restaurantId: 1, status: 1 });
BatchSchema.index({ deliveryGuyId: 1, status: 1 });
BatchSchema.index({ createdAt: -1 });

// Middleware to automatically set timestamp when status changes
BatchSchema.pre('save', function () {
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case 'PREPARED':
        if (!this.preparedAt) this.preparedAt = now;
        break;
      case 'PACKED':
        if (!this.packedAt) this.packedAt = now;
        break;
      case 'PICKED_UP':
        if (!this.pickedUpAt) this.pickedUpAt = now;
        break;
      case 'IN_TRANSIT':
        if (!this.inTransitAt) this.inTransitAt = now;
        break;
      case 'DELIVERED':
        if (!this.deliveredAt) this.deliveredAt = now;
        break;
      case 'CANCELLED':
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }
});

export const Batch = mongoose.models.Batch || mongoose.model<IBatch>('Batch', BatchSchema);
