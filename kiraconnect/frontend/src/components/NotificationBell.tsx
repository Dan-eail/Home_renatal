import { useEffect, useState, useRef } from 'react';
import { Bell, MessageCircle, Calendar, X } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { chatAPI } from '@/api/chat';

interface Notification {
  id: string;
  type: 'message' | 'booking';
  title: string;
  body: string;
  roomId?: string;
  timestamp: Date;
  read: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { onNotification } = useSocket();

  useEffect(() => {
    // Fetch initial unread count
    chatAPI.getUnreadCount().then(r => setUnreadMessages(r.count)).catch(() => {});
  }, []);

  useEffect(() => {
    const off = onNotification((data) => {
      const notif: Notification = {
        id: Date.now().toString(),
        type: 'message',
        title: `New message from ${data.from}`,
        body: data.content,
        roomId: data.roomId,
        timestamp: new Date(),
        read: false,
      };
      setNotifications(prev => [notif, ...prev.slice(0, 19)]);
      setUnreadMessages(n => n + 1);
    });
    return off;
  }, [onNotification]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalUnread = unreadMessages + notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadMessages(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
      >
        <Bell size={22} />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {unreadMessages > 0 && (
              <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100">
                <MessageCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">
                    {unreadMessages} unread message{unreadMessages > 1 ? 's' : ''}
                  </p>
                  <a href="/chat" className="text-xs text-blue-600 hover:underline">View in Chat →</a>
                </div>
              </div>
            )}

            {notifications.length === 0 && unreadMessages === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Bell size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${!n.read ? 'bg-blue-50/40' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'message' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {n.type === 'message'
                      ? <MessageCircle size={14} className="text-blue-600" />
                      : <Calendar size={14} className="text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 truncate">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {n.timestamp.toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
