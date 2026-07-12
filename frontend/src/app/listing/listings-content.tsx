'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { ListingCard } from '@/components/listing/ListingCard';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '@/lib/api';
import { Search, Loader2, RotateCcw, ChevronLeft, ChevronRight, Building } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

const ListingMap = dynamic(
  () => import('@/components/map/ListingMap').then((mod) => mod.ListingMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Initialisation de la carte...</div>
  }
);

const PROPERTY_TYPES = [
  { value: '', label: 'Tous types' },
  { value: 'HOUSE', label: 'Maison / Villa' },
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'LAND', label: 'Terrain' },
  { value: 'COMMERCIAL', label: 'Local commercial' },
];

export default function ListingsPageContent({ typeFromUrl }: { typeFromUrl?: string }) {
  const { t } = useTranslation();
  const effectiveType = typeFromUrl || 'ALL';

  const [activeTab, setActiveTab] = useState(effectiveType);
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setActiveTab(effectiveType);
  }, [effectiveType]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, minPrice, maxPrice, propertyType]);

  const apiParams: any = { page, limit: 12 };
  if (activeTab !== 'ALL') apiParams.type = activeTab;
  if (minPrice) apiParams.minPrice = parseInt(minPrice);
  if (maxPrice) apiParams.maxPrice = parseInt(maxPrice);
  if (propertyType) apiParams.propertyType = propertyType;
  if (searchQuery.trim()) apiParams.search = searchQuery.trim();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['listings', apiParams],
    queryFn: () => listingsApi.getAll(apiParams),
    select: (r) => r.data,
    placeholderData: (prev) => prev,
  });

  const listings = data?.data || [];
  const meta = data?.meta as { total: number; page: number; totalPages: number } | undefined;
  const totalPages = meta?.totalPages || 1;

  const handleResetFilters = () => {
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setPropertyType('');
    setActiveTab('ALL');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || minPrice !== '' || maxPrice !== '' || propertyType !== '' || activeTab !== 'ALL';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {['ALL', 'SALE', 'RENT'].map((tab) => (
                <Link
                  key={tab}
                  href={tab === 'ALL' ? '/listing' : `/listing?type=${tab}`}
                  className={`px-6 py-2 rounded-md font-semibold text-sm transition-all ${
                    activeTab === tab ? 'bg-white shadow-sm text-orange-500' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'ALL' ? 'Tous' : tab === 'SALE' ? 'Acheter' : 'Louer'}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-1 gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par titre, ville ou quartier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm text-gray-900"
              />
            </div>

            <input
              type="number"
              placeholder="Prix min (FCFA)"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm text-gray-900"
            />

            <input
              type="number"
              placeholder="Prix max (FCFA)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-180px)]">
        <div className="w-full lg:w-1/2 xl:w-7/12 overflow-y-auto p-4 sm:p-6 pb-24">
          {!isLoading && (
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Biens disponibles</h1>
              <span className="text-gray-500 font-medium">{meta?.total || 0} résultats</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
              <p className="text-gray-500 font-medium">Récupération de vos annonces...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{t('listings.noListingsTitle')}</h3>
              <p className="text-gray-500">{t('listings.noListingsDesc')}</p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  {t('listings.resetFilters')}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isFetching ? 'opacity-60 pointer-events-none transition-opacity' : ''}`}>
                {listings.map((listing: any) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={`min-w-[40px] h-10 rounded-lg font-semibold text-sm transition-colors ${
                        num === page
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

         <div className="hidden lg:block lg:w-1/2 xl:w-5/12 bg-gray-200 relative border-l border-gray-300 z-10">
           <ListingMap listings={listings as any} />
        </div>
      </div>
    </div>
  );
}
