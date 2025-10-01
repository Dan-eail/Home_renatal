import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Send, MessageCircle, Loader, Circle } from 'lucide-react';
import { chatAPI, Message, ChatRoom } from '@/api/chat';
import { useAuthStore } from '@/context/store';
import { useSocket } from '@/hooks/useSocket';

import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const location = useLocation();
  const { joinRoom, sendMessage, emitTyping, onReceiveMessage, onTyping, onOnlineUsers } = useSocket();

  // Load rooms on mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await chatAPI.getRooms();
        let allRooms = [...resp.rooms];
        
        // Handle "new room" from navigation state
        const preloadRoom = searchParams.get('room');
        const state = location.state as { property: any, landlord: any } | null;
        
        if (preloadRoom && !allRooms.find(r => r.roomId === preloadRoom) && state) {
          // Create a mock room object for the UI
          const mockRoom: ChatRoom = {
            roomId: preloadRoom,
            unread: 0,
            lastMessage: {
              _id: 'temp',
              roomId: preloadRoom,
              sender: user!,
              receiver: state.landlord,
              property: state.property,
              content: 'Starting a new conversation...',
              createdAt: new Date().toISOString(),
              read: true
            }
          };
          allRooms = [mockRoom, ...allRooms];
        }

        setRooms(allRooms);
        
        if (preloadRoom) {
          openRoom(preloadRoom);
        }
      } finally {
        setIsLoadingRooms(false);
      }
    })();
  }, []);

  // Socket listeners
  useEffect(() => {
    const offMsg = onReceiveMessage((msg) => {
      const m = msg as Message;
      
      // Update messages if it's the active room
      if (activeRoomId === m.roomId) {
        setMessages((prev) => {
          if (prev.find(p => p._id === m._id)) return prev;
          return [...prev, m];
        });
        setTimeout(scrollToBottom, 100);
      }

      // Update rooms list
      setRooms((prev) => {
        const roomIdx = prev.findIndex(r => r.roomId === m.roomId);
        if (roomIdx !== -1) {
          const updated = [...prev];
          updated[roomIdx] = { 
            ...updated[roomIdx], 
            lastMessage: m, 
            unread: m.roomId === activeRoomId ? 0 : updated[roomIdx].unread + 1 
          };
          // Move to top
          const [room] = updated.splice(roomIdx, 1);
          return [room, ...updated];
        } else {
          // New room!
          return [{
            roomId: m.roomId,
            unread: m.roomId === activeRoomId ? 0 : 1,
            lastMessage: m
          }, ...prev];
        }
      });
    });
    const offTyping = onTyping(({ isTyping: t }) => setIsTyping(t));
    const offOnline = onOnlineUsers((users) => setOnlineUsers(users));
    return () => { offMsg(); offTyping(); offOnline(); };
  }, [activeRoomId, onReceiveMessage, onTyping, onOnlineUsers]);

  const openRoom = useCallback(async (roomId: string) => {
    setActiveRoomId(roomId);
    setIsLoadingMsgs(true);
    joinRoom(roomId);
    setRooms(prev => prev.map(r => r.roomId === roomId ? { ...r, unread: 0 } : r));
    try {
      const resp = await chatAPI.getMessages(roomId);
      setMessages(resp.messages);
      setTimeout(scrollToBottom, 100);
    } finally {
      setIsLoadingMsgs(false);
    }
  }, [joinRoom]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSend = async () => {
    if (!input.trim() || !activeRoomId || isSending) return;
    const activeRoom = rooms.find(r => r.roomId === activeRoomId);
    if (!activeRoom) return;

    const msg = activeRoom.lastMessage;
    const receiverId = msg.sender._id === user?._id ? msg.receiver._id : msg.sender._id;
    const propertyId = msg.property._id;

    setIsSending(true);
    const content = input.trim();
    setInput('');
    emitTyping(activeRoomId, false);

    try {
      sendMessage(receiverId, propertyId, content);
      // If it was a mock room, it will be replaced by the real one when the socket message arrives
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setInput(value);
    if (!activeRoomId) return;
    emitTyping(activeRoomId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(activeRoomId, false), 2000);
  };

  const getOtherUser = (room: ChatRoom) => {
    const msg = room.lastMessage;
    return msg.sender._id === user?._id ? msg.receiver : msg.sender;
  };

  const activeRoom = rooms.find(r => r.roomId === activeRoomId);
  const otherUser = activeRoom ? getOtherUser(activeRoom) : null;
  const isOtherOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-80px)]">
      <div className="flex h-full bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

        {/* Sidebar: rooms */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <MessageCircle size={20} className="text-blue-500" />
              Messages
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingRooms ? (
              <div className="flex justify-center py-10"><Loader size={24} className="animate-spin text-blue-400" /></div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12 px-6">
                <MessageCircle size={36} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">No conversations yet.</p>
                <p className="text-gray-400 text-xs mt-1">Book a viewing to start chatting with a landlord.</p>
              </div>
            ) : (
              rooms.map((room) => {
                const other = getOtherUser(room);
                const online = onlineUsers.includes(other._id);
                return (
                  <button
                    key={room.roomId}
                    onClick={() => openRoom(room.roomId)}
                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition text-left border-b border-gray-50 ${activeRoomId === room.roomId ? 'bg-blue-50' : ''}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                        {other.avatar ? <img src={other.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : other.name[0]}
                      </div>
                      {online && <Circle size={10} className="absolute bottom-0 right-0 fill-green-500 text-green-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 text-sm truncate">{other.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {room.lastMessage ? formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: false }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {room.lastMessage?.property?.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {room.lastMessage?.sender._id === user?._id ? 'You: ' : ''}
                        {room.lastMessage?.content}
                      </p>
                    </div>
                    {room.unread > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {room.unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main chat area */}
        {!activeRoomId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <MessageCircle size={56} className="text-gray-200 mb-4" />
            <h3 className="font-bold text-xl text-gray-300 mb-2">Select a conversation</h3>
            <p className="text-gray-400 text-sm">Choose from your messages on the left</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              {otherUser && (
                <>
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                      {otherUser.avatar
                        ? <img src={otherUser.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                        : otherUser.name[0]}
                    </div>
                    {isOtherOnline && <Circle size={10} className="absolute bottom-0 right-0 fill-green-500 text-green-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{otherUser.name}</p>
                    <p className="text-xs text-gray-400">
                      {isOtherOnline ? (
                        <span className="text-green-500 font-medium">Online</span>
                      ) : 'Offline'}
                      {activeRoom?.lastMessage?.property?.title && (
                        <span> · {activeRoom.lastMessage.property.title}</span>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {isLoadingMsgs ? (
                <div className="flex justify-center py-10"><Loader size={24} className="animate-spin text-blue-400" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No messages yet. Say hello!</div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender._id === user?._id;
                  return (
                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && (
                        <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs mr-2 flex-shrink-0 self-end">
                          {msg.sender.avatar ? <img src={msg.sender.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : msg.sender.name[0]}
                        </div>
                      )}
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isOwn
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2 text-gray-400 text-sm flex items-center gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2 border border-gray-200 focus-within:border-blue-400 transition">
                <input
                  value={input}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition flex-shrink-0"
                >
                  <Send size={15} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">Press Enter to send</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
