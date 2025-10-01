import axiosInstance from './client';

export const uploadAPI = {
  uploadPropertyImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const { data } = await axiosInstance.post<{ success: boolean; urls: string[] }>(
      '/upload/property',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.urls;
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await axiosInstance.post<{ success: boolean; url: string }>(
      '/upload/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.url;
  },
};
