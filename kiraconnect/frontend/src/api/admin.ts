import axiosInstance from './client';
import { User, Property, Booking, ApiResponse } from '@/types';

export const adminAPI = {
  getDashboard: async () => {
    const { data } = await axiosInstance.get('/admin/dashboard');
    return data;
  },

  getPendingProperties: async (): Promise<{ success: boolean; properties: Property[] }> => {
    const { data } = await axiosInstance.get<{ success: boolean; properties: Property[] }>(
      '/admin/properties/pending'
    );
    return data;
  },

  approveProperty: async (id: string): Promise<{ success: boolean; property: Property }> => {
    const { data } = await axiosInstance.put<{ success: boolean; property: Property }>(
      `/admin/properties/${id}/approve`
    );
    return data;
  },

  rejectProperty: async (id: string, reason?: string): Promise<{ success: boolean; property: Property }> => {
    const { data } = await axiosInstance.put<{ success: boolean; property: Property }>(
      `/admin/properties/${id}/reject`,
      { reason }
    );
    return data;
  },

  toggleFeature: async (id: string): Promise<{ success: boolean; property: Property }> => {
    const { data } = await axiosInstance.put<{ success: boolean; property: Property }>(
      `/admin/properties/${id}/feature`
    );
    return data;
  },

  getUsers: async (role?: string, page?: number, limit?: number): Promise<{ success: boolean; users: User[] }> => {
    const { data } = await axiosInstance.get<{ success: boolean; users: User[] }>('/admin/users', {
      params: { role, page, limit },
    });
    return data;
  },

  verifyUser: async (id: string): Promise<{ success: boolean; user: User }> => {
    const { data } = await axiosInstance.put<{ success: boolean; user: User }>(`/admin/users/${id}/verify`);
    return data;
  },

  deleteUser: async (id: string): Promise<ApiResponse> => {
    const { data } = await axiosInstance.delete<ApiResponse>(`/admin/users/${id}`);
    return data;
  },

  getAnalytics: async () => {
    const { data } = await axiosInstance.get('/admin/analytics');
    return data;
  },
};
