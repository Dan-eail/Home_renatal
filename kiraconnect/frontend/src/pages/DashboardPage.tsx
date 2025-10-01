import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Heart, User, Home, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuthStore } from '@/context/store';
import { bookingsAPI } from '@/api/bookings';
import { Booking } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-800',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={14} />,
  confirmed: <CheckCircle size={14} />,
  rejected: <XCircle size={14} />,
  cancelled: <XCircle size={14} />,
  completed: <CheckCircle size={14} />,
};

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>('all');

  useEffect(() => {
    (async () => {
      try {
        const resp = await bookingsAPI.getMyBookings();
        setBookings(resp.bookings);
      } catch {
        console.error('Failed to fetch bookings');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await bookingsAPI.cancel(id);
      setBookings((b) => b.map((bk) => bk._id === id ? { ...bk, status: 'cancelled' } : bk));
    } catch {
      alert('Failed to cancel booking');
    }
  };

  const filtered = activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-extrabold text-xl">
          {user?.name?.[0]}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Welcome, {user?.name} 👋</h1>
          <p className="text-gray-500">Manage your bookings and saved properties</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Calendar, label: 'Total Bookings', val: bookings.length, color: 'bg-blue-50 text-blue-700' },
          { icon: CheckCircle, label: 'Confirmed', val: bookings.filter((b) => b.status === 'confirmed').length, color: 'bg-green-50 text-green-700' },
          { icon: Heart, label: 'Saved', val: user?.savedProperties.length || 0, color: 'bg-red-50 text-red-700' },
        ].map(({ icon: Icon, label, val, color }) => (
          <div key={label} className={`${color} rounded-xl p-4 text-center`}>
            <Icon size={24} className="mx-auto mb-2" />
            <div className="text-2xl font-extrabold">{val}</div>
            <div className="text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Bookings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-xl text-gray-900">My Bookings</h2>
          <div className="flex gap-2">
            {(['all', 'pending', 'confirmed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  activeTab === tab ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader size={32} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="font-semibold text-gray-400 mb-2">No bookings yet</p>
            <Link to="/search" className="text-blue-600 hover:underline text-sm font-medium">Browse properties</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((b) => (
              <div key={b._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Home size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <Link to={`/property/${b.property?._id}`} className="font-bold text-gray-900 hover:text-blue-600 line-clamp-1">
                      {b.property?.title || 'Property'}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {b.property?.location?.city} · {b.property?.price?.toLocaleString()} birr/mo
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Viewing: {new Date(b.viewingDate).toLocaleDateString('en-ET')} at {b.viewingTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`${STATUS_COLORS[b.status]} flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold`}>
                    {STATUS_ICONS[b.status]}
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </span>
                  {b.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(b._id)}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-full hover:bg-red-50 transition font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile quick link */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User size={24} className="text-gray-400" />
          <div>
            <p className="font-semibold text-gray-900">Your Profile</p>
            <p className="text-sm text-gray-500">{user?.email} · {user?.phone}</p>
          </div>
        </div>
        <Link to="/search" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition">
          Find a Home
        </Link>
      </div>
    </div>
  );
}
