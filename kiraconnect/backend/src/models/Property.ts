import mongoose, { Document, Schema } from 'mongoose';

export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'rented';
export type PropertyType = 'apartment' | 'house' | 'room' | 'studio' | 'villa';

export interface ILocation {
  city: string;
  subcity: string;
  kebele: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}

export interface IReview {
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IProperty extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: PropertyType;
  landlord: mongoose.Types.ObjectId;
  location: ILocation;
  price: number;
  deposit: number;
  rooms: number;
  bathrooms: number;
  size?: number;
  furnished: boolean;
  amenities: string[];
  images: string[];
  status: PropertyStatus;
  isAvailable: boolean;
  tags: string[];
  reviews: IReview[];
  averageRating: number;
  viewCount: number;
  aiPriceEstimate?: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    type: { type: String, enum: ['apartment', 'house', 'room', 'studio', 'villa'], required: true },
    landlord: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    location: {
      city: { type: String, required: true },
      subcity: { type: String, required: true },
      kebele: { type: String, required: true },
      address: { type: String, required: true },
      coordinates: { lat: Number, lng: Number },
    },
    price: { type: Number, required: true, min: 0 },
    deposit: { type: Number, default: 0, min: 0 },
    rooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    size: { type: Number },
    furnished: { type: Boolean, default: false },
    amenities: [{ type: String }],
    images: [{ type: String }],
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'rented'], default: 'pending' },
    isAvailable: { type: Boolean, default: true },
    tags: [{ type: String }],
    reviews: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    averageRating: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    aiPriceEstimate: { type: Number },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Text index for search
PropertySchema.index({ title: 'text', description: 'text', 'location.city': 'text', 'location.subcity': 'text' });
PropertySchema.index({ 'location.city': 1, price: 1, rooms: 1 });
PropertySchema.index({ status: 1, isAvailable: 1 });

// Auto-calculate averageRating
PropertySchema.pre('save', function (next) {
  if (this.reviews.length > 0) {
    this.averageRating = this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
  }
  next();
});

export default mongoose.model<IProperty>('Property', PropertySchema);
