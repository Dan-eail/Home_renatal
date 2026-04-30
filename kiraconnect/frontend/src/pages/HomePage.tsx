import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Shield, MessageCircle, TrendingUp, Star, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/context/store';

const CITIES = ['Addis Ababa', 'Adama', 'Bahir Dar', 'Hawassa', 'Mekelle', 'Dire Dawa'];

const STATS = [
  { label: 'Active Listings', value: '2,400+' },
  { label: 'Cities Covered', value: '8' },
  { label: 'Verified Landlords', value: '98%' },
  { label: 'Broker Fee', value: '0%' },
];

const FEATURES = [
  { icon: Shield, title: 'Verified Listings', desc: 'Every landlord is ID-verified. No more fake posts.' },
  { icon: TrendingUp, title: 'AI Price Estimator', desc: 'Know if a listing is fairly priced before you enquire.' },
  { icon: MessageCircle, title: 'Direct Chat', desc: 'Talk to landlords directly — zero broker commissions.' },
  { icon: Star, title: 'Tenant Reviews', desc: 'Read real reviews from tenants who lived there.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Search & Filter', desc: 'Filter by city, kebele, price range, and number of rooms.' },
  { step: '02', title: 'Book a Viewing', desc: 'Schedule a visit directly with the landlord — no broker needed.' },
  { step: '03', title: 'Sign Digitally', desc: 'Sign a digital rent agreement and move in with confidence.' },
];

export default function HomePage() {
  const [city, setCity] = useState('');
  const [rooms, setRooms] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (rooms) params.set('rooms', rooms);
    if (maxPrice) params.set('maxPrice', maxPrice);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          {!user && (
            <div className="flex justify-end mb-4 gap-3">
              <Link to="/login" className="bg-white/10 border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition text-sm">
                Login
              </Link>
              <Link to="/register" className="bg-white text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition text-sm font-bold">
                Register
              </Link>
            </div>
          )}
          <span className="bg-green-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-6 inline-block">
            🇪🇹 Ethiopia's Trusted Rental Platform
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-6 leading-tight">
            Find Your Perfect<br />
            <span className="text-blue-200">Home in Ethiopia</span>
          </h1>
          <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">
            No brokers. No fake listings. Verified homes in Addis Ababa, Adama, Bahir Dar and more — listed directly by landlords.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 max-w-4xl mx-auto shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Cities</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Rooms</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
              </select>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Price</option>
                <option value="5000">Under 5,000 birr</option>
                <option value="10000">Under 10,000 birr</option>
                <option value="20000">Under 20,000 birr</option>
                <option value="50000">Under 50,000 birr</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Search size={20} />
                Search
              </button>
            </div>
          </form>

          {/* Quick city links */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => navigate(`/search?city=${c}`)}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1 rounded-full text-sm transition"
              >
                <MapPin size={14} />
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-blue-600">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Why KiraConnect?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built specifically for Ethiopia's rental market — transparent, safe, and broker-free.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center hover:shadow-md transition">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon size={28} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">From search to move-in in three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="relative text-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-5xl font-black text-blue-100 mb-4">{step}</div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-4">Ready to find your next home?</h2>
          <p className="text-blue-100 mb-8">Join thousands of Ethiopians who found their perfect rental on KiraConnect.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/search"
              className="bg-white text-blue-700 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition flex items-center gap-2"
            >
              Browse Homes <ArrowRight size={20} />
            </Link>
            {!user && (
              <Link
                to="/register"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition"
              >
                List Your Property
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
