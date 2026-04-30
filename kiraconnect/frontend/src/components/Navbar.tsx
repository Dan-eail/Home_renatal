import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, LogOut, User, Heart, MessageCircle, BarChart2 } from 'lucide-react';
import { useAuthStore } from '@/context/store';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };

  const getDashLink = () => {
    if (user?.role === 'admin') return '/admin-dashboard';
    if (user?.role === 'landlord') return '/landlord-dashboard';
    return '/dashboard';
  };

  const navLinks = [
    { to: '/search', label: 'Search' },
    { to: getDashLink(), label: 'Dashboard' },
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    ...(user?.role === 'tenant' ? [{ to: '/saved', label: 'Saved', icon: Heart }] : []),
    ...(user?.role === 'admin' ? [{ to: '/analytics', label: 'Analytics', icon: BarChart2 }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-blue-600">
            <Home size={24} /> KiraConnect
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${isActive(to) ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <NotificationBell />
            <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden">
                {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user?.name?.[0]}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 leading-none">{user?.name?.split(' ')[0]}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </Link>
            <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition" title="Logout">
              <LogOut size={20} />
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-700">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1 border-t border-gray-100">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${isActive(to) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                {Icon && <Icon size={16} />}{label}
              </Link>
            ))}
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              <User size={16} /> Profile
            </Link>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
