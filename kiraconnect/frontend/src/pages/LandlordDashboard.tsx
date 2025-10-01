import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Home, Calendar, CheckCircle, XCircle, Clock, Eye, Loader, Trash2 } from 'lucide-react';
import { propertiesAPI } from '@/api/properties';
import { bookingsAPI } from '@/api/bookings';
import { Property, Booking } from '@/types';
import { useAuthStore } from '@/context/store';
import AddPropertyModal from '@/components/AddPropertyModal';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  rented: 'bg-blue-100 text-blue-800',
};

const BOOKING_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-800',
};

export default function LandlordDashboard() {
  const user = useAuthStore((state) => state.user);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'properties' | 'bookings'>('properties');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [propsResp, booksResp] = await Promise.all([
        propertiesAPI.getMyListings(),
        bookingsAPI.getMyBookings(),
      ]);
      setProperties(propsResp.properties);
      setBookings(booksResp.bookings);
    } catch {
      console.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this property?')) return;
    await propertiesAPI.delete(id);
    setProperties((p) => p.filter((pr) => pr._id !== id));
  };

  const handleBookingAction = async (id: string, action: 'confirm' | 'reject') => {
    try {
      const resp = action === 'confirm' ? await bookingsAPI.confirm(id) : await bookingsAPI.reject(id);
      setBookings((b) => b.map((bk) => bk._id === id ? resp.booking : bk));
    } catch {
      alert(`Failed to ${action} booking`);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Landlord Dashboard</h1>
          <p className="text-gray-500">Hello, {user?.name}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
        >
          <Plus size={20} /> List Property
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Listings', val: properties.length, color: 'bg-blue-50 text-blue-700', icon: Home },
          { label: 'Approved', val: properties.filter((p) => p.status === 'approved').length, color: 'bg-green-50 text-green-700', icon: CheckCircle },
          { label: 'Pending Review', val: properties.filter((p) => p.status === 'pending').length, color: 'bg-yellow-50 text-yellow-700', icon: Clock },
          { label: 'New Bookings', val: pendingBookings.length, color: 'bg-purple-50 text-purple-700', icon: Calendar },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className={`${color} rounded-xl p-4 text-center`}>
            <Icon size={22} className="mx-auto mb-2" />
            <div className="text-2xl font-extrabold">{val}</div>
            <div className="text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 border-b border-gray-200">
        {(['properties', 'bookings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition ${
              activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'properties' ? `Properties (${properties.length})` : `Bookings (${bookings.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader size={36} className="animate-spin text-blue-500" />
        </div>
      ) : activeTab === 'properties' ? (
        /* Properties list */
        properties.length === 0 ? (
          <div className="text-center py-20">
            <Home size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-semibold mb-4">No listings yet</p>
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
              Add Your First Property
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((p) => (
              <div key={p._id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl overflow-hidden flex-shrink-0">
                    {p.images[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center"><Home size={24} className="text-white" /></div>}
                  </div>
                  <div>
                    <Link to={`/property/${p._id}`} className="font-bold text-gray-900 hover:text-blue-600">{p.title}</Link>
                    <p className="text-sm text-gray-500">{p.location.kebele}, {p.location.city}</p>
                    <p className="text-sm font-semibold text-blue-700 mt-1">{p.price.toLocaleString()} birr/mo</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`${STATUS_COLORS[p.status]} px-3 py-1 rounded-full text-xs font-bold capitalize`}>
                    {p.status}
                  </span>
                  <span className="flex items-center gap-1 text-gray-400 text-sm">
                    <Eye size={14} />{p.viewCount}
                  </span>
                  <button onClick={() => handleDelete(p._id)} className="text-red-400 hover:text-red-600 transition p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Bookings list */
        bookings.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-semibold">No bookings received yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b._id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:shadow-sm transition">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {b.tenant?.name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{b.tenant?.name}</p>
                      <p className="text-xs text-gray-500">{b.tenant?.phone}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{b.property?.title}</p>
                  <p className="text-sm text-gray-500">
                    📅 {new Date(b.viewingDate).toLocaleDateString('en-ET')} at {b.viewingTime}
                  </p>
                  {b.message && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-2 italic">"{b.message}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`${BOOKING_COLORS[b.status]} px-3 py-1 rounded-full text-xs font-bold capitalize`}>
                    {b.status}
                  </span>
                  {b.status === 'pending' && (
                    <>
                      <button onClick={() => handleBookingAction(b._id, 'confirm')} className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition">
                        <CheckCircle size={14} /> Confirm
                      </button>
                      <button onClick={() => handleBookingAction(b._id, 'reject')} className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 transition">
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showAddModal && (
        <AddPropertyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}
