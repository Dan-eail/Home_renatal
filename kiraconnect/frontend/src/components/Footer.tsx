import { Link } from 'react-router-dom';
import { Heart, Facebook, Twitter, Instagram, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-20 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <div>
              <h3 className="font-black text-2xl tracking-tight mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                KiraConnect
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Ethiopia's most trusted rental platform. We connect verified landlords directly with tenants, eliminating broker fees and fake listings.
              </p>
            </div>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-300">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Platform</h4>
            <ul className="space-y-4">
              <li><Link to="/search" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Search Homes</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">How It Works</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* For Landlords Column */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">For Landlords</h4>
            <ul className="space-y-4">
              <li><Link to="/landlord-dashboard" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">List Property</Link></li>
              <li><Link to="/landlord-dashboard" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Manage Bookings</Link></li>
              <li><Link to="/landlord-dashboard" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Landlord Portal</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Support</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Terms of Service</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm font-medium">
            &copy; {currentYear} KiraConnect. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50">
            Made with <Heart size={14} className="text-red-500 fill-red-500" /> in Addis Ababa, Ethiopia
          </div>
        </div>
      </div>
    </footer>
  );
}
