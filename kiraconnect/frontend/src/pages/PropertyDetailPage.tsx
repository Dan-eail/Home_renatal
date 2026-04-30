import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Home, Bath, Star, CheckCircle, Calendar, MessageCircle, Loader } from 'lucide-react';
import MapView from '@/components/MapView';
import { propertiesAPI } from '@/api/properties';
import { bookingsAPI } from '@/api/bookings';
import { Property } from '@/types';
import { useAuthStore } from '@/context/store';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [booking, setBooking] = useState({ viewingDate: '', viewingTime: '10:00', message: '' });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const resp = await propertiesAPI.getById(id);
        setProperty(resp.property);
      } catch {
        navigate('/search');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setBookingLoading(true);
    setBookingError('');
    try {
      await bookingsAPI.create({ propertyId: id!, ...booking });
      setBookingSuccess('Booking request sent! The landlord will be in touch.');
      setShowBookingForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking failed';
      setBookingError(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader size={40} className="animate-spin text-blue-500" />
    </div>
  );

  if (!property) return null;

  const diff = property.aiPriceEstimate
    ? Math.round(((property.price - property.aiPriceEstimate) / property.aiPriceEstimate) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Images */}
      <div className="mb-8">
        {property.images.length > 0 ? (
          <div>
            <div className="h-96 rounded-2xl overflow-hidden mb-3 bg-gray-200">
              <img src={property.images[activeImage]} alt={property.title} className="w-full h-full object-cover" />
            </div>
            {property.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {property.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${i === activeImage ? 'border-blue-500' : 'border-transparent'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-96 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white">
            <Home size={60} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Price */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl font-extrabold text-gray-900">{property.title}</h1>
              {property.isFeatured && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">⭐ Featured</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <MapPin size={18} />
              <span>{property.location.kebele}, {property.location.subcity}, {property.location.city}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-3xl font-extrabold text-gray-900">
                {property.price.toLocaleString()} <span className="text-lg font-normal text-gray-500">birr/month</span>
              </span>
              {property.deposit > 0 && (
                <span className="text-gray-500 text-sm">Deposit: {property.deposit.toLocaleString()} birr</span>
              )}
              {property.aiPriceEstimate && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  diff > 10 ? 'bg-red-50 text-red-700' : diff < -10 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                }`}>
                  <DollarSign size={16} />
                  AI estimate: {property.aiPriceEstimate.toLocaleString()} birr
                  <span className="font-bold">({diff > 0 ? '+' : ''}{diff}%)</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-5">
            {[
              { icon: Home, label: 'Bedrooms', val: property.rooms },
              { icon: Bath, label: 'Bathrooms', val: property.bathrooms },
              { icon: Home, label: 'Type', val: property.type.charAt(0).toUpperCase() + property.type.slice(1) },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="text-center">
                <Icon size={24} className="mx-auto text-blue-500 mb-1" />
                <div className="font-bold text-gray-900">{val}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {property.furnished && <span className="badge badge-primary">Furnished</span>}
            {property.tags.map((tag) => (
              <span key={tag} className="badge bg-gray-100 text-gray-700">{tag}</span>
            ))}
          </div>

          {/* Description */}
          <div>
            <h2 className="font-bold text-xl text-gray-900 mb-3">About this property</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
          </div>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div>
              <h2 className="font-bold text-xl text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <h2 className="font-bold text-xl text-gray-900 mb-4">
              Reviews ({property.reviews.length})
              {property.averageRating > 0 && (
                <span className="ml-3 text-yellow-500 text-base font-normal flex items-center gap-1 inline-flex">
                  <Star size={18} className="fill-yellow-400" />{property.averageRating.toFixed(1)}
                </span>
              )}
            </h2>
            {property.reviews.length === 0 ? (
              <p className="text-gray-400 italic">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {property.reviews.map((r, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                          {r.user?.name?.[0] || 'U'}
                        </div>
                        <span className="font-semibold text-gray-800">{r.user?.name}</span>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} size={14} className={j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Landlord + Booking */}
        <div className="space-y-5">
          {/* Landlord card */}
          <div className="card p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">About the Landlord</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xl">
                {property.landlord?.name?.[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900">{property.landlord?.name}</p>
                {property.landlord?.isVerified && (
                  <span className="text-green-600 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle size={12} /> Verified Landlord
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-2 border-t border-gray-200 pt-4">
              <div>📞 {property.landlord?.phone}</div>
              <div>📧 {property.landlord?.email}</div>
              {property.landlord?.city && <div>📍 {property.landlord?.city}</div>}
            </div>
          </div>

          {/* Booking */}
          {bookingSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm font-medium">
              ✅ {bookingSuccess}
            </div>
          )}
          {!bookingSuccess && (
            <div className="card p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Book a Viewing</h3>
              {!showBookingForm ? (
                <button
                  onClick={() => user ? setShowBookingForm(true) : navigate('/login')}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Calendar size={20} />
                  Schedule Viewing
                </button>
              ) : (
                <form onSubmit={handleBooking} className="space-y-4">
                  {bookingError && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{bookingError}</div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={booking.viewingDate}
                      onChange={(e) => setBooking((b) => ({ ...b, viewingDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={booking.viewingTime}
                      onChange={(e) => setBooking((b) => ({ ...b, viewingTime: e.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                    <textarea
                      value={booking.message}
                      onChange={(e) => setBooking((b) => ({ ...b, message: e.target.value }))}
                      placeholder="Hi, I'm interested in viewing this property..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="flex-1 border border-gray-300 py-2 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                    >
                      {bookingLoading ? <Loader size={16} className="animate-spin" /> : null}
                      Send Request
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Chat */}
          {user && property.landlord._id !== user._id && (
            <button
              onClick={() => {
                const roomId = [user._id, property.landlord._id].sort().join('_') + '_' + property._id;
                navigate(`/chat?room=${roomId}`, { 
                  state: { 
                    property: { _id: property._id, title: property.title, images: property.images },
                    landlord: property.landlord 
                  } 
                });
              }}
              className="w-full border border-blue-500 text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              Chat with Landlord
            </button>
          )}

          {/* Map */}
          {(property.location.coordinates?.lat || property.location.city) && (
            <div>
              <h3 className="font-bold text-sm text-gray-700 mb-2 uppercase tracking-wide">Location</h3>
              <MapView
                lat={property.location.coordinates?.lat}
                lng={property.location.coordinates?.lng}
                title={property.title}
                city={property.location.city}
                height="200px"
                zoom={13}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
