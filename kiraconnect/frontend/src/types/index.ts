export type UserRole = 'tenant' | 'landlord' | 'admin';
export type PropertyType = 'apartment' | 'house' | 'room' | 'studio' | 'villa';
export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'rented';
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface Location {
  city: string;
  subcity: string;
  kebele: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  nationalIdVerified: boolean;
  city?: string;
  savedProperties: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  user: User;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Property {
  _id: string;
  title: string;
  description: string;
  type: PropertyType;
  landlord: User;
  location: Location;
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
  reviews: Review[];
  averageRating: number;
  viewCount: number;
  aiPriceEstimate?: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  property: Property;
  tenant: User;
  landlord: User;
  status: BookingStatus;
  viewingDate: string;
  viewingTime: string;
  message: string;
  landlordNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}
