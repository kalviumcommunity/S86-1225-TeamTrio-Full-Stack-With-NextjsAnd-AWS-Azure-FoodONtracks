import mongoose, { Schema, Model } from 'mongoose';
import { UserRole, ROLE_LEVELS, ROLE_EMAIL_RULES } from '@/types/user';

// Re-export for backward compatibility
export { UserRole, ROLE_LEVELS, ROLE_EMAIL_RULES };

export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  roleLevel?: number;
  phoneNumber?: string;
  address?: string;
  restaurantId?: mongoose.Types.ObjectId; // For RESTAURANT_OWNER
  isActive?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      required: true,
    },
    roleLevel: {
      type: Number,
      default: function() {
        return ROLE_LEVELS[this.role as UserRole] || 1;
      },
    },
    phoneNumber: {
      type: String,
      trim: true,
      required: function() {
        return this.role === 'DELIVERY_GUY';
      },
    },
    address: {
      type: String,
      trim: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: false, // Optional - only set for RESTAURANT_OWNER after restaurant creation
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to set role level
UserSchema.pre('save', function(this: any, next: any) {
  if (this.isModified('role')) {
    this.roleLevel = ROLE_LEVELS[this.role as UserRole];
  }
  next();
});

// Indexes for performance (email index already created by unique: true)
UserSchema.index({ role: 1 });
UserSchema.index({ restaurantId: 1 });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
