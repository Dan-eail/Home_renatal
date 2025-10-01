import { useState, useRef } from 'react';
import { User, Camera, Lock, Save, Loader, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/context/store';
import { uploadAPI } from '@/api/upload';
import { authAPI } from '@/api/auth';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadAPI.uploadAvatar(file);
      await updateProfile({ avatar: url });
    } catch {
      alert('Avatar upload failed');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      await updateProfile(form);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    setPwSaving(true);
    try {
      await authAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPwSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch {
      setPwError('Current password is incorrect');
    } finally {
      setPwSaving(false);
    }
  };

  const CITIES = ['Addis Ababa', 'Adama', 'Bahir Dar', 'Hawassa', 'Mekelle', 'Dire Dawa'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900">My Profile</h1>

      {/* Avatar + basic info card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-gray-100">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-3xl overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : user?.name?.[0]}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow-md"
            >
              {avatarUploading ? <Loader size={12} className="animate-spin" /> : <Camera size={13} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div>
            <p className="font-bold text-xl text-gray-900">{user?.name}</p>
            <p className="text-gray-500 text-sm capitalize">{user?.role}</p>
            <div className="flex items-center gap-2 mt-1">
              {user?.isVerified
                ? <span className="text-green-600 text-xs font-semibold flex items-center gap-1"><CheckCircle size={12} /> Verified</span>
                : <span className="text-yellow-600 text-xs font-medium">Not verified</span>}
            </div>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleProfileSave} className="space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <User size={18} className="text-blue-500" /> Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
              <input value={user?.email || ''} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">City</label>
              <select
                value={form.city}
                onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                className="input-field"
              >
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {profileSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <CheckCircle size={16} /> Profile updated successfully
            </div>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {profileSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Password change */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Lock size={18} className="text-blue-500" /> Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{pwError}</div>
          )}
          {pwSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <CheckCircle size={16} /> Password updated successfully
            </div>
          )}
          {[
            { label: 'Current Password', key: 'currentPassword' },
            { label: 'New Password', key: 'newPassword' },
            { label: 'Confirm New Password', key: 'confirmPassword' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{label}</label>
              <input
                type="password"
                value={passwordForm[key as keyof typeof passwordForm]}
                onChange={(e) => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                className="input-field"
                required
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center gap-2 bg-gray-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-900 disabled:opacity-60 transition"
          >
            {pwSaving ? <Loader size={16} className="animate-spin" /> : <Lock size={16} />}
            Update Password
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-sm text-gray-500 space-y-2">
        <p><strong>Account ID:</strong> {user?._id}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Member since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
        <p><strong>Saved properties:</strong> {user?.savedProperties?.length || 0}</p>
      </div>
    </div>
  );
}
