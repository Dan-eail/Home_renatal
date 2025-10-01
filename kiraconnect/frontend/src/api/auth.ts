import axiosInstance from './client';
import { User, ApiResponse } from '@/types';

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'tenant' | 'landlord';
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export const authAPI = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  getMe: async (): Promise<{ success: boolean; user: User }> => {
    const { data } = await axiosInstance.get<{ success: boolean; user: User }>('/auth/me');
    return data;
  },

  updateProfile: async (payload: Partial<User>): Promise<{ success: boolean; user: User }> => {
    const { data } = await axiosInstance.put<{ success: boolean; user: User }>('/auth/profile', payload);
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    const { data } = await axiosInstance.put<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};
