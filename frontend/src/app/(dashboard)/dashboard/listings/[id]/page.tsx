'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { listingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, formatPrice, statusLabel, statusBadgeClass } from '@/lib/utils';
import { Loader2, ArrowLeft, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { useRequireAuth } from '@/lib/useRequireAuth';

export default function ListingDetailPage() {
  const params = useParams();
  const { user, isMounted } = useRequireAuth();
  const id = params.id as string;

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getOne(id),
    select: (r) => r.data,
    enabled: isMounted && !!id && !!user,
  });

  if (!isMounted || !user) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard/listings" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Retour à mes annonces
          </Link>

          {isLoading ? (
            <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
          ) : !listing ? (
            <div className="text-center py-20">
              <h2 className="text-xl font-bold text-gray-900">Annonce introuvable</h2>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
                    <p className="text-gray-500 text-sm mt-1">{listing.city} — Publiée le {formatDate(listing.createdAt)}</p>
                  </div>
                  <span className={statusBadgeClass(listing.status)}>{statusLabel(listing.status)}</span>
                </div>

                {listing.photos?.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {listing.photos.map((photo: any) => (
                      <img key={photo.id} src={photo.url} alt={`Photo de l'annonce ${listing.title}`} className="w-full h-32 object-cover rounded-lg" />
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Prix</p>
                    <p className="text-lg font-bold text-gray-900">{formatPrice(listing.price)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Surface</p>
                    <p className="text-lg font-bold text-gray-900">{listing.area || '—'} m²</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Pièces</p>
                    <p className="text-lg font-bold text-gray-900">{listing.rooms || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Vues</p>
                    <p className="text-lg font-bold text-gray-900">{listing.viewCount}</p>
                  </div>
                </div>

                {listing.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Link href={`/listing/${listing.id}`} className="btn-outline flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4" /> Voir sur le site
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
