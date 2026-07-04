'use client';
import Link from 'next/link';
import { MapPin, Bed, Square, Bath } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ListingCard({ listing }: { listing: any }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // FIX #1: Extract URL from photo object (handle both string and object)
  const imageUrl = listing?.images?.[0] || 
    (listing?.photos?.[0] ? (typeof listing.photos[0] === 'string' ? listing.photos[0] : listing.photos[0].url) : null) ||
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&h=300&fit=crop';
  
  // Formatage sécurisé pour l'hydratation
  const displayPrice = mounted && listing?.price 
    ? new Intl.NumberFormat('fr-FR').format(listing.price) 
    : listing?.price || 0;

  return (
    <Link href={`/listing/${listing?.id}`}>
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-card hover:shadow-card-hover transition-all duration-200 group cursor-pointer h-full flex flex-col">
        {/* Image et Badges */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={listing?.title || 'Annonce immobilière'} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
          <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
            {listing?.type === 'SALE' ? 'À Vendre' : 'À Louer'}
          </div>
          <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-semibold">
            {listing?.propertyType || 'Résidentiel'}
          </div>
        </div>
        
        {/* Informations */}
        <div className="p-5 flex flex-col flex-1">
          <p className="text-2xl font-extrabold text-orange-500 mb-2">
            {displayPrice} FCFA
          </p>
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {listing?.title}
          </h3>
          <div className="flex items-center text-gray-500 text-sm mb-4">
            <MapPin size={16} className="mr-1 text-orange-500" /> 
            <span className="truncate">
              {listing?.address || listing?.city || 'Localisation non renseignée'}
            </span>
          </div>
          
          {/* Statistiques (Chambres, Salles de bain, Surface) */}
          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center gap-1 font-medium"><Bed size={16} className="text-gray-400"/> {listing?.bedrooms || 0} ch.</span>
            <span className="flex items-center gap-1 font-medium"><Bath size={16} className="text-gray-400"/> {listing?.bathrooms || 0} sdb.</span>
            <span className="flex items-center gap-1 font-medium"><Square size={16} className="text-gray-400"/> {listing?.area || 0} m²</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
