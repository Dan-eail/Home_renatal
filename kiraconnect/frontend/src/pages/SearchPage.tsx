import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Loader, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { propertiesAPI, SearchQuery } from '@/api/properties';
import { Property } from '@/types';

const CITIES = ['Addis Ababa', 'Adama', 'Bahir Dar', 'Hawassa', 'Mekelle', 'Dire Dawa'];
const TYPES = ['apartment', 'house', 'room', 'studio', 'villa'];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<SearchQuery>({
    city: searchParams.get('city') || '',
    rooms: searchParams.get('rooms') ? Number(searchParams.get('rooms')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    minPrice: undefined,
    type: searchParams.get('type') || '',
    furnished: undefined,
    search: searchParams.get('search') || '',
    page: 1,
    limit: 12,
    sort: '-createdAt',
  });

  // Sync filters from URL on mount and URL changes
  useEffect(() => {
    const newFilters: SearchQuery = {
      city: searchParams.get('city') || '',
      rooms: searchParams.get('rooms') ? Number(searchParams.get('rooms')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      type: searchParams.get('type') || '',
      furnished: searchParams.get('furnished') === 'true' ? true : searchParams.get('furnished') === 'false' ? false : undefined,
      search: searchParams.get('search') || '',
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 12,
      sort: searchParams.get('sort') || '-createdAt',
    };
    setFilters(newFilters);
  }, [searchParams]);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const clean: SearchQuery = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      );
      const resp = await propertiesAPI.search(clean);
      setProperties(resp.properties);
      setTotal(resp.total);
      setPages(resp.pages);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterChange = (key: keyof SearchQuery, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined, page: 1 };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) {
        params.set(k, String(v));
      }
    });
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {filters.city ? `Rentals in ${filters.city}` : 'All Listings'}
          </h1>
          {!isLoading && <p className="text-gray-500 mt-1">{total} properties found</p>}
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 transition"
        >
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.search || ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search by title, area, amenity..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
          Search
        </button>
      </form>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">City</label>
              <select
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All cities</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Rooms</label>
              <select
                value={filters.rooms || ''}
                onChange={(e) => handleFilterChange('rooms', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                {[1, 2, 3, 4].map((r) => <option key={r} value={r}>{r} BR</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Min Price</label>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
                placeholder="Any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Type</label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Furnished</label>
              <select
                value={filters.furnished === undefined ? '' : String(filters.furnished)}
                onChange={(e) => handleFilterChange('furnished', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="true">Furnished</option>
                <option value="false">Unfurnished</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Sort by</label>
              <select
                value={filters.sort || '-createdAt'}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="-createdAt">Newest</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-averageRating">Top Rated</option>
              </select>
            </div>
            <button
              onClick={() => setFilters({ page: 1, limit: 12, sort: '-createdAt' })}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader size={40} className="animate-spin text-blue-500" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl font-bold text-gray-300 mb-3">No properties found</p>
          <p className="text-gray-500">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((p) => <PropertyCard key={p._id} property={p} />)}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            disabled={(filters.page || 1) <= 1}
            onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
          >
            <ChevronLeft size={18} /> Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {filters.page} of {pages}
          </span>
          <button
            disabled={(filters.page || 1) >= pages}
            onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
