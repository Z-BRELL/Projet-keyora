'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Petite rustine obligatoire pour afficher correctement les icônes par défaut sous Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MapLeaflet() {
  // Coordonnées centrales (Yaoundé)
  const centerPosition = [3.8480, 11.5021];

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', zIndex: 0 }}>
      <MapContainer 
        center={centerPosition as L.LatLngExpression} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
      >
        {/* Le fond de carte OpenStreetMap (Gratuit et sans clé !) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marqueur pour la Villa à Bastos */}
        <Marker position={[3.8854, 11.5165]}>
          <Popup>
            <strong>Villa moderne avec piscine</strong> <br />
            Bastos, Yaoundé <br />
            <em>180 000 000 FCFA</em>
          </Popup>
        </Marker>

        {/* Marqueur pour l'Appartement au Golf */}
        <Marker position={[3.8900, 11.5200]}>
          <Popup>
            <strong>Appartement de luxe</strong> <br />
            Quartier Golf, Yaoundé <br />
            <em>350 000 FCFA / mois</em>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}