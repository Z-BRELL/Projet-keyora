'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { searchApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface MapListing {
  id: string;
  title: string;
  price: number;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  type: string;
  cover_url?: string;
}

interface ListingMapProps {
  listings?: MapListing[];
  center?: [number, number];
  zoom?: number;
  showDraw?: boolean;
  onPolygonSearch?: (results: MapListing[], geoJson?: any) => void;
  height?: string;
}

// Filter listings that have valid GPS coordinates
function filterListingsWithCoords(listings: MapListing[]): (MapListing & { latitude: number; longitude: number })[] {
  return listings.filter(
    (l): l is MapListing & { latitude: number; longitude: number } =>
      typeof l.latitude === 'number' && typeof l.longitude === 'number' &&
      !isNaN(l.latitude) && !isNaN(l.longitude)
  );
}

// SVG house icon as data URI (blue for SALE, red for RENT)
function createHouseIcon(type: string) {
  const color = type === 'SALE' ? '#3b82f6' : '#ef4444';
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
      <defs>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M4 28 L24 6 L44 28 L40 28 L40 44 L30 44 L30 30 L18 30 L18 44 L8 44 L8 28 Z"
        fill="${color}" stroke="white" stroke-width="2" filter="url(#s)"/>
      <rect x="20" y="20" width="8" height="8" rx="1" fill="white" opacity="0.8"/>
    </svg>
  `)}`;
}

export function ListingMap({
  listings = [],
  center = [3.8667, 11.5167],
  zoom = 12,
  showDraw = false,
  onPolygonSearch,
  height = '500px',
}: ListingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [ready, setReady] = useState(false);

  // Only keep listings that have valid GPS coordinates
  const geolocatedListings = useMemo(() => filterListingsWithCoords(listings), [listings]);

  // Initialize map once (keeps running if ref not ready yet)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapInstanceRef.current) return;
    if (!mapRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        // @ts-ignore
        await import('leaflet/dist/leaflet.css');
        
        try {
          // @ts-ignore
          await import('leaflet.markercluster');
          // @ts-ignore
          await import('leaflet.markercluster/dist/MarkerCluster.css');
          // @ts-ignore
          await import('leaflet.markercluster/dist/MarkerCluster.Default.css');
        } catch(e) {
          console.warn('MarkerCluster not yet available', e);
        }

        if (!isMounted || mapInstanceRef.current) return;

        const map = L.map(mapRef.current!, {
          center,
          zoom,
          zoomControl: true,
        });
        mapInstanceRef.current = map;
        LRef.current = L;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // Utilisation de markerClusterGroup pour regrouper les marqueurs (ex: même adresse)
        const markersLayer = (L as any).markerClusterGroup ? (L as any).markerClusterGroup().addTo(map) : L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        setReady(true);

        if (showDraw && onPolygonSearch) {
          // @ts-ignore
          await import('leaflet-draw');
          // @ts-ignore
          await import('leaflet-draw/dist/leaflet.draw.css');

          const drawnItems = new L.FeatureGroup();
          map.addLayer(drawnItems);

          const drawControl = new (L as any).Control.Draw({
            edit: { featureGroup: drawnItems },
            draw: {
              polygon: { shapeOptions: { color: '#6c5ce7', weight: 2 } },
              rectangle: { shapeOptions: { color: '#6c5ce7', weight: 2 } },
              circle: false, circlemarker: false, marker: false, polyline: false,
            },
          });
          map.addControl(drawControl);

          map.on((L as any).Draw.Event.CREATED, async (e: any) => {
            drawnItems.clearLayers();
            drawnItems.addLayer(e.layer);
            const geojson = e.layer.toGeoJSON();
            const geometry = geojson.geometry;
            const coords: number[][] = geojson.geometry.coordinates[0].map(
              ([lng, lat]: [number, number]) => [lng, lat],
            );
            setIsSearching(true);
            try {
              const { data } = (await searchApi.byPolygon({ polygon: coords })) as any;
              onPolygonSearch(data.data || [], geometry);
              toast.success(`${data.meta?.total || 0} bien(s) trouvé(s) dans la zone`);
            } catch {
              toast.error('Erreur lors de la recherche');
            } finally {
              setIsSearching(false);
            }
          });
        }
      } catch (error) {
        console.error("Erreur d'initialisation de la carte:", error);
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [center, zoom, showDraw, onPolygonSearch]);

  // Update markers when listings change (no geocoding — only GPS coords)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer || !ready) return;

    markersLayer.clearLayers();

    const L = LRef.current;
    if (!L) return;

    for (const listing of geolocatedListings) {
      const iconUrl = createHouseIcon(listing.type);
      const icon = L.icon({
        iconUrl,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48],
      });

      const marker = L.marker([listing.latitude, listing.longitude], { icon }).addTo(markersLayer);

      const color = listing.type === 'SALE' ? '#3b82f6' : '#ef4444';
      marker.bindPopup(`
        <div style="min-width:200px; font-family: system-ui;">
          <strong style="font-size:13px; color: #1f2937;">${listing.title}</strong><br>
          <span style="color:${color}; font-weight:600; font-size:12px;">${formatPrice(listing.price)}</span><br>
          <span style="color:#6b7280; font-size:11px;">📍 ${listing.city}${listing.address ? ', ' + listing.address : ''}</span><br>
          <a href="/listing/${listing.id}" style="color:${color}; font-size:12px; text-decoration: none; font-weight: 600;">
            Voir l'annonce →
          </a>
        </div>
      `);
    }
  }, [geolocatedListings, ready]);

  return (
    <div className="relative w-full" style={{ height }}>
      {isSearching && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] bg-white rounded-xl px-4 py-2 shadow-lg text-sm font-medium text-primary-600 flex items-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
          </svg>
          Recherche en cours…
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" />
    </div>
  );
}
