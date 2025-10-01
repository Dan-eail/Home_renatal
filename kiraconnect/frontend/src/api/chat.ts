import axiosInstance from './client';

export interface Message {
  _id: string;
  roomId: string;
  sender: { _id: string; name: string; avatar?: string };
  receiver: { _id: string; name: string; avatar?: string };
  property: { _id: string; title: string; location?: { city: string }; images?: string[] };
  content: string;
  read: boolean;
  createdAt: string;
}

export interface ChatRoom {
  roomId: string;
  unread: number;
  lastMessage: Message;
}

export const chatAPI = {
  getRooms: async (): Promise<{ success: boolean; rooms: ChatRoom[] }> => {
    const { data } = await axiosInstance.get('/chat/rooms');
    return data;
  },

  getMessages: async (roomId: string): Promise<{ success: boolean; messages: Message[] }> => {
    const { data } = await axiosInstance.get(`/chat/${roomId}`);
    return data;
  },

  sendMessage: async (
    receiverId: string,
    propertyId: string,
    content: string
  ): Promise<{ success: boolean; message: Message }> => {
    const { data } = await axiosInstance.post('/chat/send', { receiverId, propertyId, content });
    return data;
  },

  getUnreadCount: async (): Promise<{ success: boolean; count: number }> => {
    const { data } = await axiosInstance.get('/chat/unread/count');
    return data;
  },
};
