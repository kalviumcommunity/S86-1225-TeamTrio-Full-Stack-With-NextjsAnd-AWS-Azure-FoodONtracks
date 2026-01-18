import mongoose, { Document, Schema } from 'mongoose';

// Review model for storing customer feedback on restaurants and delivery
export interface IReview extends Document {
  // References
  customerId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  batchNumber: string; // For traceability
  restaurantId: mongoose.Types.ObjectId;
  deliveryGuyId?: mongoose.Types.ObjectId;
  
  // Restaurant rating
  restaurantRating?: number; // 1-5
  restaurantComment?: string;
  restaurantRatedAt?: Date;
  
  // Delivery rating
  deliveryRating?: number; // 1-5
  deliveryComment?: string;
  deliveryRatedAt?: Date;
  
  // Legacy ratings (kept for compatibility)
  foodRating?: number;
  packagingRating?: number;
  overallRating?: number;
  
  // Review content
  comment?: string;
  images?: string[]; // URLs to uploaded images
  
  // Order details for reference
  orderNumber?: string;
  totalAmount?: number;
  
  // Response
  restaurantResponse?: {
    comment: string;
    respondedAt: Date;
    respondedBy: mongoose.Types.ObjectId;
  };
  
  // Moderation
  isVerified: boolean; // Verified purchase review
  isFlagged: boolean;
  flagReason?: string;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  
  // Visibility
  isPublished: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    batchNumber: {
      type: String,
      required: true,
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    deliveryGuyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    
    // Restaurant rating fields
    restaurantRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    restaurantComment: {
      type: String,
      trim: true,
    },
    restaurantRatedAt: {
      type: Date,
    },
    
    // Delivery rating fields
    deliveryRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    deliveryComment: {
      type: String,
      trim: true,
    },
    deliveryRatedAt: {
      type: Date,
    },
    
    // Order details
    orderNumber: {
      type: String,
    },
    totalAmount: {
      type: Number,
    },
    
    // Legacy fields (optional for compatibility)
    foodRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    packagingRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    
    comment: String,
    images: [String],
    
    restaurantResponse: {
      comment: String,
      respondedAt: Date,
      respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    
    isVerified: {
      type: Boolean,
      default: true, // Automatically verified if linked to real order
      index: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    flagReason: String,
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: Date,
    
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
ReviewSchema.index({ restaurantId: 1, isPublished: 1, createdAt: -1 });
ReviewSchema.index({ customerId: 1, createdAt: -1 });
ReviewSchema.index({ isFlagged: 1, isPublished: 1 });

// Ensure one review per order
ReviewSchema.index({ customerId: 1, orderId: 1 }, { unique: true });

// Middleware to calculate overall rating if not provided
ReviewSchema.pre('save', function () {
  if (this.isModified('foodRating') || this.isModified('packagingRating') || this.isModified('deliveryRating')) {
    const ratings = [];
    if (this.foodRating) ratings.push(this.foodRating);
    if (this.packagingRating) ratings.push(this.packagingRating);
    if (this.deliveryRating) ratings.push(this.deliveryRating);
    
    if (ratings.length > 0) {
      this.overallRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    }
  }
});

// Delete cached model to ensure middleware is properly registered
if (mongoose.models.Review) {
  delete mongoose.models.Review;
}

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
