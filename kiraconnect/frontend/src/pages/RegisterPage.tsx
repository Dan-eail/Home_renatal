import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Loader, Building, User } from 'lucide-react';
import { useAuthStore } from '@/context/store';
import axios from 'axios';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'tenant' as 'tenant' | 'landlord' });
  const [error, setError] = useState('');
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.phone, form.password, form.role);
      navigate('/');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Registration failed.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Home size={32} className="text-blue-600" />
            <span className="text-2xl font-extrabold text-gray-900">KiraConnect</span>
          </div>
          <p className="text-gray-500">Create your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>
        )}

        {/* Role selector */}
        <div className="flex gap-3 mb-6">
          {(['tenant', 'landlord'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: r }))}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition ${
                form.role === r
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {r === 'tenant' ? <User size={18} /> : <Building size={18} />}
              {r === 'tenant' ? 'Tenant' : 'Landlord'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Abebe Girma' },
            { label: 'Email', name: 'email', type: 'email', placeholder: 'you@example.com' },
            { label: 'Phone', name: 'phone', type: 'tel', placeholder: '+251 91 234 5678' },
            { label: 'Password', name: 'password', type: 'password', placeholder: 'At least 6 characters' },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="input-field"
                required
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader size={20} className="animate-spin" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
