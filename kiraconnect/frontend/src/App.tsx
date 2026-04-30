import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/context/store';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import SearchPage from '@/pages/SearchPage';
import PropertyDetailPage from '@/pages/PropertyDetailPage';
import DashboardPage from '@/pages/DashboardPage';
import LandlordDashboard from '@/pages/LandlordDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import SavedPropertiesPage from '@/pages/SavedPropertiesPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const user = useAuthStore((state) => state.user);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {user && <Navbar />}
        <main className="flex-1">
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />

            {/* Tenant */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['tenant']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute allowedRoles={['tenant']}><SavedPropertiesPage /></ProtectedRoute>} />

            {/* Landlord */}
            <Route path="/landlord-dashboard" element={<ProtectedRoute allowedRoles={['landlord']}><LandlordDashboard /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AnalyticsPage /></ProtectedRoute>} />

            {/* Authenticated */}
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        {user && <Footer />}
      </div>
    </Router>
  );
}

export default App;
