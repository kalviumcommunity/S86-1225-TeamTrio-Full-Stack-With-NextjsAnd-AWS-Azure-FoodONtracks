import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'RESTAURANT_CREATED'
  | 'RESTAURANT_UPDATED'
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_CANCELLED'
  | 'BATCH_CREATED'
  | 'BATCH_STATUS_CHANGED'
  | 'BATCH_ASSIGNED'
  | 'REVIEW_CREATED'
  | 'REVIEW_UPDATED'
  | 'REVIEW_DELETED'
  | 'REVIEW_FLAGGED'
  | 'DELIVERY_AGENT_VERIFIED'
  | 'DELIVERY_AGENT_DEACTIVATED'
  | 'PERMISSION_CHANGED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT';

export interface IAuditLog extends Document {
  action: AuditAction;
  
  // Who performed the action
  performedBy?: mongoose.Types.ObjectId; // null for system actions
  performedByRole?: string;
  
  // What was affected
  targetType?: 'User' | 'Restaurant' | 'Order' | 'Batch' | 'Review' | 'DeliveryAgent';
  targetId?: mongoose.Types.ObjectId;
  
  // Details
  details?: Record<string, any>;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  
  // Result
  success: boolean;
  errorMessage?: string;
  
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    performedByRole: String,
    
    targetType: {
      type: String,
      enum: ['User', 'Restaurant', 'Order', 'Batch', 'Review', 'DeliveryAgent'],
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    
    details: Schema.Types.Mixed,
    
    ipAddress: String,
    userAgent: String,
    
    success: {
      type: Boolean,
      default: true,
      index: true,
    },
    errorMessage: String,
    
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Using custom timestamp field
  }
);

// Compound indexes for common queries
AuditLogSchema.index({ performedBy: 1, timestamp: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, success: 1, timestamp: -1 });

// TTL index to auto-delete old logs after 90 days (optional)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
