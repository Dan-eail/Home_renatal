import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;
  status: BookingStatus;
  viewingDate: Date;
  viewingTime: string;
  message: string;
  landlordNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    tenant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    landlord: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    viewingDate: { type: Date, required: true },
    viewingTime: { type: String, required: true },
    message: { type: String, required: true, maxlength: 500 },
    landlordNote: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

BookingSchema.index({ tenant: 1, status: 1 });
BookingSchema.index({ landlord: 1, status: 1 });
BookingSchema.index({ property: 1 });

export default mongoose.model<IBooking>('Booking', BookingSchema);
