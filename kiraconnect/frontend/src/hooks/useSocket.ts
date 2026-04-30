import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/context/store';

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const useSocket = () => {
  const user = useAuthStore((state) => state.user);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    if (!socket) {
      socket = io(SOCKET_URL, { transports: ['polling', 'websocket'] });
    }

    socketRef.current = socket;
    socket.emit('user_online', user._id);

    return () => {
      // Don't disconnect on unmount — keep socket alive globally
    };
  }, [user]);

  const joinRoom = useCallback((roomId: string) => {
    socket?.emit('join_room', roomId);
  }, []);

  const sendMessage = useCallback(
    (receiverId: string, propertyId: string, content: string) => {
      if (!user) return;
      socket?.emit('send_message', {
        senderId: user._id,
        receiverId,
        propertyId,
        content,
        senderName: user.name,
        senderAvatar: user.avatar,
      });
    },
    [user]
  );

  const emitTyping = useCallback(
    (roomId: string, isTyping: boolean) => {
      if (!user) return;
      socket?.emit('typing', { roomId, userId: user._id, isTyping });
    },
    [user]
  );

  const onReceiveMessage = useCallback(
    (callback: (msg: unknown) => void) => {
      socket?.on('receive_message', callback);
      return () => { socket?.off('receive_message', callback); };
    },
    []
  );

  const onTyping = useCallback(
    (callback: (data: { userId: string; isTyping: boolean }) => void) => {
      socket?.on('user_typing', callback);
      return () => { socket?.off('user_typing', callback); };
    },
    []
  );

  const onNotification = useCallback(
    (callback: (data: { from: string; content: string; roomId: string }) => void) => {
      socket?.on('new_message_notification', callback);
      return () => { socket?.off('new_message_notification', callback); };
    },
    []
  );

  const onOnlineUsers = useCallback(
    (callback: (users: string[]) => void) => {
      socket?.on('online_users', callback);
      return () => { socket?.off('online_users', callback); };
    },
    []
  );

  return {
    socket: socketRef.current,
    joinRoom,
    sendMessage,
    emitTyping,
    onReceiveMessage,
    onTyping,
    onNotification,
    onOnlineUsers,
  };
};
