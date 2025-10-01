import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, Loader } from 'lucide-react';
import { propertiesAPI } from '@/api/properties';
import { Property } from '@/types';
import PropertyCard from '@/components/PropertyCard';
import { useAuthStore } from '@/context/store';

export default function SavedPropertiesPage() {
  const user = useAuthStore((state) => state.user);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.savedProperties?.length) {
      setIsLoading(false);
      return;
    }
    // Fetch each saved property
    (async () => {
      try {
        const results = await Promise.allSettled(
          user.savedProperties.map(id => propertiesAPI.getById(id as unknown as string))
        );
        const valid = results
          .filter((r): r is PromiseFulfilledResult<{ success: boolean; property: Property }> => r.status === 'fulfilled')
          .map(r => r.value.property);
        setProperties(valid);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user?.savedProperties]);

  const handleSaveChange = (id: string, saved: boolean) => {
    if (!saved) setProperties(p => p.filter(prop => prop._id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={24} className="text-red-500 fill-red-500" />
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Saved Properties</h1>
          <p className="text-gray-500">{properties.length} saved</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader size={36} className="animate-spin text-blue-500" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={56} className="mx-auto text-gray-200 mb-4" />
          <p className="text-xl font-bold text-gray-300 mb-2">No saved properties yet</p>
          <p className="text-gray-400 mb-6">Tap the heart icon on any listing to save it here</p>
          <Link to="/search" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
            <Search size={18} /> Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map(p => (
            <PropertyCard
              key={p._id}
              property={p}
              onSaveChange={(saved) => handleSaveChange(p._id, saved)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
