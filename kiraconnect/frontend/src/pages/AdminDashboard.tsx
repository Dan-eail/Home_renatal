import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Users, Home, BarChart2, Star, Loader, Shield } from 'lucide-react';
import { adminAPI } from '@/api/admin';
import { Property, User } from '@/types';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  pendingListings: number;
  approvedListings: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pending, setPending] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'users'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [dashResp, pendResp, usersResp] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getPendingProperties(),
        adminAPI.getUsers(),
      ]);
      setStats(dashResp.stats);
      setPending(pendResp.properties);
      setUsers(usersResp.users);
    } catch {
      console.error('Failed to fetch admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id: string) => {
    await adminAPI.approveProperty(id);
    setPending((p) => p.filter((pr) => pr._id !== id));
    setStats((s) => s ? { ...s, pendingListings: s.pendingListings - 1, approvedListings: s.approvedListings + 1 } : null);
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection (optional):') || '';
    await adminAPI.rejectProperty(id, reason);
    setPending((p) => p.filter((pr) => pr._id !== id));
    setStats((s) => s ? { ...s, pendingListings: s.pendingListings - 1 } : null);
  };

  const handleVerifyUser = async (id: string) => {
    const resp = await adminAPI.verifyUser(id);
    setUsers((u) => u.map((usr) => usr._id === id ? resp.user : usr));
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    await adminAPI.deleteUser(id);
    setUsers((u) => u.filter((usr) => usr._id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Shield size={28} className="text-blue-600" />
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage listings, users, and platform health</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart2 },
          { key: 'listings', label: `Pending Listings ${stats ? `(${stats.pendingListings})` : ''}`, icon: Home },
          { key: 'users', label: `Users ${stats ? `(${stats.totalUsers})` : ''}`, icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 pb-3 px-2 font-semibold text-sm border-b-2 transition ${
              activeTab === key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader size={36} className="animate-spin text-blue-500" />
        </div>
      ) : activeTab === 'overview' ? (
        /* Overview */
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Users', val: stats?.totalUsers || 0, color: 'bg-blue-50 text-blue-700' },
              { label: 'Total Properties', val: stats?.totalProperties || 0, color: 'bg-purple-50 text-purple-700' },
              { label: 'Approved', val: stats?.approvedListings || 0, color: 'bg-green-50 text-green-700' },
              { label: 'Pending Review', val: stats?.pendingListings || 0, color: 'bg-yellow-50 text-yellow-700' },
              { label: 'Total Bookings', val: stats?.totalBookings || 0, color: 'bg-indigo-50 text-indigo-700' },
            ].map(({ label, val, color }) => (
              <div key={label} className={`${color} rounded-xl p-5 text-center`}>
                <div className="text-3xl font-extrabold">{val}</div>
                <div className="text-xs font-medium mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
              <Star size={18} /> Listings waiting for approval
            </h3>
            {pending.length === 0 ? (
              <p className="text-yellow-700 text-sm">No listings pending review — you're all caught up! ✅</p>
            ) : (
              <p className="text-yellow-700 text-sm">
                <strong>{pending.length}</strong> listings are waiting for your review.{' '}
                <button onClick={() => setActiveTab('listings')} className="underline font-semibold">Review now →</button>
              </p>
            )}
          </div>
        </div>
      ) : activeTab === 'listings' ? (
        /* Pending listings */
        pending.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle size={48} className="mx-auto text-green-200 mb-4" />
            <p className="font-semibold text-gray-400">All listings reviewed — nothing pending.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((p) => (
              <div key={p._id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:shadow-sm transition">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl overflow-hidden flex-shrink-0">
                    {p.images[0]
                      ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Home size={24} className="text-white" /></div>}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{p.title}</p>
                    <p className="text-sm text-gray-500">{p.location.kebele}, {p.location.city}</p>
                    <p className="text-sm text-blue-700 font-semibold">{p.price.toLocaleString()} birr/mo · {p.rooms}BR</p>
                    <div className="mt-1 text-xs text-gray-500">
                      By: <span className="font-medium">{(p.landlord as User)?.name}</span>
                      {(p.landlord as User)?.isVerified
                        ? <span className="text-green-600 ml-2">✓ Verified</span>
                        : <span className="text-yellow-600 ml-2">⚠ Unverified</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(p._id)}
                    className="flex items-center gap-1 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(p._id)}
                    className="flex items-center gap-1 bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-200 transition"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Users list */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'Role', 'Phone', 'Verified', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'landlord' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{u.phone}</td>
                  <td className="px-5 py-3">
                    {u.isVerified
                      ? <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Yes</span>
                      : <span className="text-gray-400">No</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      {!u.isVerified && (
                        <button onClick={() => handleVerifyUser(u._id)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition font-medium">
                          Verify
                        </button>
                      )}
                      {u.role !== 'admin' && (
                        <button onClick={() => handleDeleteUser(u._id)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 transition font-medium">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
