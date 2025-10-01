import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { propertiesAPI } from '@/api/properties';
import ImageUploader from './ImageUploader';

interface AddPropertyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CITIES = ['Addis Ababa', 'Adama', 'Bahir Dar', 'Hawassa', 'Mekelle', 'Dire Dawa'];
const TYPES = ['apartment', 'house', 'room', 'studio', 'villa'];
const AMENITIES_LIST = ['WiFi', 'Parking', 'Security', 'Water 24/7', 'Generator', 'Garden', 'Elevator', 'CCTV'];

export default function AddPropertyModal({ onClose, onSuccess }: AddPropertyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'apartment',
    price: '',
    deposit: '',
    rooms: '1',
    bathrooms: '1',
    furnished: false,
    amenities: [] as string[],
    images: [] as string[],
    location: { city: 'Addis Ababa', subcity: '', kebele: '', address: '' },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const key = name.split('.')[1];
      setForm((f) => ({ ...f, location: { ...f.location, [key]: value } }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const toggleAmenity = (a: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await propertiesAPI.create({
        ...form,
        price: Number(form.price),
        deposit: Number(form.deposit),
        rooms: Number(form.rooms),
        bathrooms: Number(form.bathrooms),
      });
      onSuccess();
    } catch (err: unknown) {
      setError('Failed to create property. Check all fields.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Add New Property</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Basic Information</h3>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Property title" className="input-field" required />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the property..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <select name="type" value={form.type} onChange={handleChange} className="input-field">
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.furnished}
                  onChange={(e) => setForm((f) => ({ ...f, furnished: e.target.checked }))}
                  className="w-5 h-5 rounded text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Furnished</span>
              </label>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <select name="location.city" value={form.location.city} onChange={handleChange} className="input-field">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input name="location.subcity" value={form.location.subcity} onChange={handleChange} placeholder="Subcity" className="input-field" required />
              <input name="location.kebele" value={form.location.kebele} onChange={handleChange} placeholder="Kebele" className="input-field" required />
              <input name="location.address" value={form.location.address} onChange={handleChange} placeholder="Street address" className="input-field" required />
            </div>
          </div>

          {/* Pricing & details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Pricing & Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Monthly Rent (Birr)</label>
                <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="e.g. 12000" className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Deposit (Birr)</label>
                <input name="deposit" type="number" value={form.deposit} onChange={handleChange} placeholder="e.g. 24000" className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bedrooms</label>
                <input name="rooms" type="number" min="0" value={form.rooms} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bathrooms</label>
                <input name="bathrooms" type="number" min="0" value={form.bathrooms} onChange={handleChange} className="input-field" required />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition font-medium ${
                    form.amenities.includes(a)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Photos</h3>
            <ImageUploader
              onUpload={(urls) => setForm((f) => ({ ...f, images: [...f.images, ...urls] }))}
              existingUrls={form.images}
              maxImages={5}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {isLoading ? <><Loader size={18} className="animate-spin" /> Submitting...</> : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
