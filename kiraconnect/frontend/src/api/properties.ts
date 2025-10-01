import axiosInstance from './client';
import { Property, ApiResponse } from '@/types';

export interface SearchQuery {
  city?: string;
  subcity?: string;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  furnished?: boolean;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

interface SearchResponse {
  success: boolean;
  count: number;
  total: number;
  pages: number;
  currentPage: number;
  properties: Property[];
}

export const propertiesAPI = {
  search: async (query: SearchQuery): Promise<SearchResponse> => {
    const { data } = await axiosInstance.get<SearchResponse>('/properties', { params: query });
    return data;
  },

  getById: async (id: string): Promise<{ success: boolean; property: Property }> => {
    const { data } = await axiosInstance.get<{ success: boolean; property: Property }>(`/properties/${id}`);
    return data;
  },

  create: async (payload: Partial<Property>): Promise<{ success: boolean; property: Property }> => {
    const { data } = await axiosInstance.post<{ success: boolean; property: Property }>('/properties', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Property>): Promise<{ success: boolean; property: Property }> => {
    const { data } = await axiosInstance.put<{ success: boolean; property: Property }>(`/properties/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const { data } = await axiosInstance.delete<ApiResponse>(`/properties/${id}`);
    return data;
  },

  getMyListings: async (): Promise<{ success: boolean; properties: Property[] }> => {
    const { data } = await axiosInstance.get<{ success: boolean; properties: Property[] }>(
      '/properties/landlord/my-listings'
    );
    return data;
  },

  addReview: async (
    id: string,
    rating: number,
    comment: string
  ): Promise<{ success: boolean; property: Property }> => {
    const { data } = await axiosInstance.post<{ success: boolean; property: Property }>(`/properties/${id}/review`, {
      rating,
      comment,
    });
    return data;
  },

  save: async (id: string): Promise<{ success: boolean; saved: boolean }> => {
    const { data } = await axiosInstance.post<{ success: boolean; saved: boolean }>(`/properties/${id}/save`);
    return data;
  },
};
