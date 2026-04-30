import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, DollarSign, User, Star } from 'lucide-react';
import { Property } from '@/types';
import { useAuthStore } from '@/context/store';
import { propertiesAPI } from '@/api/properties';

interface PropertyCardProps {
  property: Property;
  onSaveChange?: (saved: boolean) => void;
}

export default function PropertyCard({ property, onSaveChange }: PropertyCardProps) {
  const user = useAuthStore((state) => state.user);
  const [isSaved, setIsSaved] = useState(user?.savedProperties.includes(property._id) || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await propertiesAPI.save(property._id);
      setIsSaved(response.saved);
      onSaveChange?.(response.saved);
    } catch (error) {
      console.error('Failed to save property:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const pricePercentageDiff = property.aiPriceEstimate
    ? Math.round(((property.price - (property.aiPriceEstimate || 0)) / (property.aiPriceEstimate || 1)) * 100)
    : 0;

  return (
    <Link to={`/property/${property._id}`}>
      <div className="card overflow-hidden hover:shadow-lg cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
          {property.images.length > 0 ? (
            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <span className="text-sm">{property.type.toUpperCase()}</span>
            </div>
          )}

          {/* Featured badge */}
          {property.isFeatured && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
              Featured
            </div>
          )}

          {/* Save button */}
          {user && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="absolute top-2 left-2 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
              title={isSaved ? 'Remove from saved' : 'Save property'}
            >
              <Heart
                size={20}
                className={isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}
              />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{property.title}</h3>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
            <MapPin size={16} />
            <span>{property.location.kebele}, {property.location.city}</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-green-600" />
            <span className="font-bold text-lg text-gray-900">{property.price.toLocaleString()} birr/mo</span>
            {property.aiPriceEstimate && (
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                pricePercentageDiff > 10 ? 'bg-red-100 text-red-700' :
                pricePercentageDiff < -10 ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {pricePercentageDiff > 0 ? '+' : ''}{pricePercentageDiff}%
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex gap-4 mb-3 text-sm text-gray-600">
            <span className="font-medium">{property.rooms}BR</span>
            <span className="font-medium">{property.bathrooms}BA</span>
            {property.furnished && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Furnished</span>}
          </div>

          {/* Rating */}
          {property.averageRating > 0 && (
            <div className="flex items-center gap-2 text-sm mb-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.round(property.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-gray-600">({property.reviews.length})</span>
            </div>
          )}

          {/* Landlord */}
          <div className="flex items-center gap-2 text-xs text-gray-600 mt-auto pt-3 border-t border-gray-200">
            <User size={14} />
            <span>{property.landlord.name}</span>
            {property.landlord.isVerified && (
              <span className="text-green-600 font-bold">✓</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
