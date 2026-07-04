'use client';

import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '@/lib/api';
import { ListingCard } from './ListingCard';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Props {
  ownerId: string;
  currentListingId: string;
}

export function OtherListingsFromSeller({ ownerId, currentListingId }: Props) {
  const { t } = useTranslation();
  
  const { data, isLoading } = useQuery({
    queryKey: ['listings', 'owner', ownerId],
    queryFn: () => listingsApi.getAll({ ownerId, limit: 4 }),
    select: (r) => r.data.data,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const otherListings = data?.filter((l: any) => l.id !== currentListingId) || [];

  if (otherListings.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {t('listings.otherFromSeller', {})}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {otherListings.map((listing: any) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
