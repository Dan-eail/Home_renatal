import { useEffect, useRef } from 'react';

interface MapViewProps {
  lat?: number;
  lng?: number;
  title?: string;
  city?: string;
  height?: string;
  zoom?: number;
}

// Default coordinates for Ethiopian cities
const CITY_COORDS: Record<string, [number, number]> = {
  'Addis Ababa': [9.0192, 38.7525],
  'Adama': [8.5400, 39.2700],
  'Bahir Dar': [11.5936, 37.3900],
  'Hawassa': [7.0600, 38.4750],
  'Mekelle': [13.4967, 39.4667],
  'Dire Dawa': [9.5900, 41.8500],
};

export default function MapView({ lat, lng, title, city, height = '300px', zoom = 14 }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  const coords: [number, number] =
    lat && lng ? [lat, lng] : city && CITY_COORDS[city] ? CITY_COORDS[city] : [9.0192, 38.7525];

  useEffect(() => {
    let isMounted = true;
    let L: typeof import('leaflet') | null = null;
    let map: import('leaflet').Map | null = null;

    const initMap = async () => {
      // Prevent double init if mapInstanceRef already has a map
      if (!mapRef.current || mapInstanceRef.current) return;

      L = await import('leaflet');
      if (!isMounted || !mapRef.current) return;

      // Check one last time before creating to avoid race conditions
      // Leaflet attaches a property to the container, but we'll use our ref
      if (mapInstanceRef.current) return;

      try {
        // Fix default marker icons
        delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(coords, zoom);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const marker = L.marker(coords).addTo(map);
        if (title) {
          marker.bindPopup(`<strong>${title}</strong>${city ? `<br/>${city}` : ''}`, { maxWidth: 200 }).openPopup();
        }
      } catch (err) {
        console.error('Leaflet init error:', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as import('leaflet').Map).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords[0], coords[1], zoom, title, city]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapRef} style={{ height, width: '100%' }} />
    </div>
  );
}
