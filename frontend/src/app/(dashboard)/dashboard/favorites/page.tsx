'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { listingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, formatPrice, listingTypeLabel, propertyTypeLabel } from '@/lib/utils';

import { useRequireAuth } from '@/lib/useRequireAuth';

export default function DashboardFavoritesPage() {
  const { user, isMounted } = useRequireAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'favorites'],
    queryFn: () => listingsApi.getFavorites(),
    enabled: isMounted && !!user,
    select: (response) => response.data,
  });

  if (!isMounted || !user) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Mes favoris</h1>
            <p className="text-gray-500">Retrouvez les annonces que vous avez enregistrées.</p>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="card p-5 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="card p-12 text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucun favori</h2>
              <p className="text-gray-500 mb-6">Sauvegardez des annonces pour les retrouver ici.</p>
              <Link href="/listing" className="btn-primary inline-flex">
                Découvrir les annonces
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {data.map((favorite: any) => {
                const listing = favorite.listing;
                return (
                  <div key={`${favorite.userId}-${favorite.listingId}`} className="card p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {listing.photos?.[0]?.url ? (
                          <img src={listing.photos[0].url} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900 truncate">{listing.title}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {listing.city || 'Ville non renseignée'} · {propertyTypeLabel(listing.propertyType)} · {listingTypeLabel(listing.type)}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">{formatPrice(listing.price)}</span>
                          <span>Mis en favori le {formatDate(favorite.savedAt)}</span>
                        </div>
                      </div>

                      <Link href={`/listing/${listing.id}`} className="btn-outline text-sm inline-flex justify-center">
                        Voir
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}