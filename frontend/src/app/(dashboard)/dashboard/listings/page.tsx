'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { listingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, formatPrice, listingTypeLabel, propertyTypeLabel, statusBadgeClass, statusLabel } from '@/lib/utils';

import { useRequireAuth } from '@/lib/useRequireAuth';

export default function DashboardListingsPage() {
  const { user, isMounted } = useRequireAuth();

  const isOwner = ['SELLER', 'SUPERADMIN'].includes(user?.role || '');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'my-listings'],
    queryFn: () => listingsApi.getMyListings(),
    enabled: isMounted && !!user && isOwner,
    select: (response) => response.data,
  });

  if (!isMounted || !user) return null;

  if (!isOwner) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès réservé</h1>
            <p className="text-gray-500 mb-6">Cette page est réservée aux vendeurs et administrateurs.</p>
            <Link href="/dashboard" className="btn-primary inline-flex">
              Retour au dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Mes annonces</h1>
              <p className="text-gray-500">Gérez vos annonces publiées, en attente ou rejetées.</p>
            </div>
            <Link href="/sell" className="btn-primary">
              Nouvelle annonce
            </Link>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucune annonce</h2>
              <p className="text-gray-500 mb-6">Publiez votre première annonce pour commencer.</p>
              <Link href="/sell" className="btn-primary inline-flex">
                Publier une annonce
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {data.map((listing: any) => (
                <div key={listing.id} className="card p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {listing.photos?.[0]?.url ? (
                        <img src={listing.photos[0].url} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold text-gray-900 truncate">{listing.title}</h2>
                          <p className="text-sm text-gray-500 mt-1">
                            {listing.city || 'Ville non renseignée'} · {propertyTypeLabel(listing.propertyType)} · {listingTypeLabel(listing.type)}
                          </p>
                        </div>
                        <span className={statusBadgeClass(listing.status)}>{statusLabel(listing.status)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{formatPrice(listing.price)}</span>
                        <span>{listing._count?.favorites || 0} favori(s)</span>
                        <span>{listing.viewCount || 0} vue(s)</span>
                        <span>Créée le {formatDate(listing.createdAt)}</span>
                      </div>
                    </div>

                    <Link href={`/listing/${listing.id}`} className="btn-outline text-sm inline-flex justify-center">
                      Voir
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}