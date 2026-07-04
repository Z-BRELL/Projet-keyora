'use client';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '@/lib/api';
import { ListingCard } from './ListingCard';

export function FeaturedListings() {
  const { data, isLoading } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: () => listingsApi.getAll({ limit: 6, page: 1 }),
    select: (res) => res.data.data,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-52 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {data?.map((listing: any) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
