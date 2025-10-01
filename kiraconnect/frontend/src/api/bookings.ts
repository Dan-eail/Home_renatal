import axiosInstance from './client';
import { Booking, ApiResponse } from '@/types';

interface CreateBookingPayload {
  propertyId: string;
  viewingDate: string;
  viewingTime: string;
  message: string;
}

export const bookingsAPI = {
  create: async (payload: CreateBookingPayload): Promise<{ success: boolean; booking: Booking }> => {
    const { data } = await axiosInstance.post<{ success: boolean; booking: Booking }>('/bookings', payload);
    return data;
  },

  getMyBookings: async (status?: string): Promise<{ success: boolean; bookings: Booking[] }> => {
    const { data } = await axiosInstance.get<{ success: boolean; bookings: Booking[] }>('/bookings', {
      params: status ? { status } : {},
    });
    return data;
  },

  getById: async (id: string): Promise<{ success: boolean; booking: Booking }> => {
    const { data } = await axiosInstance.get<{ success: boolean; booking: Booking }>(`/bookings/${id}`);
    return data;
  },

  confirm: async (id: string): Promise<{ success: boolean; booking: Booking }> => {
    const { data } = await axiosInstance.put<{ success: boolean; booking: Booking }>(`/bookings/${id}/confirm`);
    return data;
  },

  reject: async (id: string, landlordNote?: string): Promise<{ success: boolean; booking: Booking }> => {
    const { data } = await axiosInstance.put<{ success: boolean; booking: Booking }>(`/bookings/${id}/reject`, {
      landlordNote,
    });
    return data;
  },

  cancel: async (id: string): Promise<{ success: boolean; booking: Booking }> => {
    const { data } = await axiosInstance.put<{ success: boolean; booking: Booking }>(`/bookings/${id}/cancel`);
    return data;
  },
};
