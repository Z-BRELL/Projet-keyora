'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  MapPin, Heart, Share2, MessageCircle, ShoppingCart,
  Bed, Bath, Move, Car, Eye, ArrowLeft, ChevronLeft,
  ChevronRight, Loader2, Home, Sofa, UtensilsCrossed,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { OtherListingsFromSeller } from '@/components/listing/OtherListingsFromSeller';
import { listingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

function Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-[500px] bg-gray-200 rounded-2xl mb-8" />
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
          <div className="w-[400px] h-64 bg-gray-200 rounded-2xl" />
        </div>
      </main>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [photoIndex, setPhotoIndex] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getOne(id),
    select: (r) => r.data,
    enabled: !!id,
  });

  useEffect(() => {
    if (listing?.isFavorited !== undefined) {
      setFavorited(listing.isFavorited);
    }
  }, [listing?.isFavorited]);

  const favMutation = useMutation({
    mutationFn: () => listingsApi.toggleFavorite(id),
    onMutate: () => setFavorited((f) => !f),
    onError: () => {
      setFavorited((f) => !f);
      toast.error('Erreur lors de la mise en favori');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing', id] });
      toast.success(favorited ? 'Retiré des favoris' : 'Ajouté aux favoris');
    },
  });

  const handleContact = () => {
    if (!user) {
      toast.error('Connectez-vous pour contacter le vendeur');
      router.push('/auth/login');
      return;
    }
    if (!listing) return;
    if (user.id === listing.ownerId) {
      toast.error("C'est votre propre annonce");
      return;
    }

    setContactLoading(true);

    try {
      const params = new URLSearchParams({
        sellerId: listing.ownerId,
        listingId: id,
        listingTitle: listing.title,
        listingAddress: listing.address || '',
        listingCity: listing.city || '',
        listingPrice: listing.price.toString(),
        listingPhoto: photos[photoIndex],
        photoIndex: (photoIndex + 1).toString(),
        totalPhotos: photos.length.toString(),
      });

      toast.success('Ouverture de la conversation...');
      router.push(`/dashboard/messages?${params.toString()}`);
    } finally {
      setContactLoading(false);
    }
  };

  const handleBuy = () => {
    if (!user) {
      toast.error('Connectez-vous pour continuer');
      router.push('/auth/login');
      return;
    }
    handleContact();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Lien copié !');
  };

  if (isLoading) return <Skeleton />;

  if (isError || !listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">Annonce introuvable ou supprimée.</p>
        <button onClick={() => router.push('/listing')} className="btn-primary">
          Retour aux annonces
        </button>
      </div>
    );
  }

  // FIX #1: Extract URL from photo objects
  const photos: string[] = listing.photos?.length
    ? listing.photos.map((p: any) => typeof p === 'string' ? p : p.url)
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'];

  const typeLabel = listing.type === 'SALE' ? 'Vente' : 'Location';
  const propTypeLabel: Record<string, string> = {
    APARTMENT: 'Appartement',
    HOUSE: 'Maison',
    LAND: 'Terrain',
    COMMERCIAL: 'Local commercial',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux annonces
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            {/* Main Photo Gallery */}
            <div className="relative rounded-2xl overflow-hidden h-[420px] sm:h-[500px] bg-gray-200 shadow-lg group">
              <img
                src={photos[photoIndex]}
                alt={`Photo ${photoIndex + 1}`}
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'; }}
                className="w-full h-full object-cover transition-opacity duration-300"
              />

              {/* Photo Navigation */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex((i: number) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-800" />
                  </button>
                  <button
                    onClick={() => setPhotoIndex((i: number) => (i + 1) % photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-800" />
                  </button>
                  
                  {/* Dot Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === photoIndex ? 'bg-white scale-125' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Type and Property Type Badge */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {typeLabel}
                </span>
                {listing.propertyType && (
                  <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
                    {propTypeLabel[listing.propertyType] ?? listing.propertyType}
                  </span>
                )}
              </div>

              {/* View Count */}
              <div className="absolute top-4 right-4 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                <Eye className="w-3 h-3" /> {listing.viewCount ?? 0} vues
              </div>

              {/* First Photo Label */}
              {photoIndex === 0 && photos.length > 1 && (
                <div className="absolute bottom-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  📸 Vue extérieure
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 px-1">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all relative ${
                      i === photoIndex
                        ? 'border-primary-500 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={p} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'; }} className="w-full h-full object-cover" alt={`Miniature ${i + 1}`} />
                    {i === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white text-xs font-bold">
                        Ext.
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Property Details */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                {listing.title}
              </h1>
              <div className="flex items-center text-gray-500 mb-6">
                <MapPin className="w-4 h-4 text-orange-500 mr-1.5 flex-shrink-0" />
                <span>
                  {listing.address ? `${listing.address}, ` : ''}{listing.city}
                </span>
              </div>

              {/* Key Property Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {listing.area && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Move className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-xs text-gray-400">Surface</p>
                      <span className="text-sm font-bold text-gray-900">{listing.area} m²</span>
                    </div>
                  </div>
                )}
                {listing.rooms && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Home className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-xs text-gray-400">Pièces</p>
                      <span className="text-sm font-bold text-gray-900">{listing.rooms}</span>
                    </div>
                  </div>
                )}
                {listing.bedrooms && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Bed className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-xs text-gray-400">Chambres</p>
                      <span className="text-sm font-bold text-gray-900">{listing.bedrooms}</span>
                    </div>
                  </div>
                )}
                {listing.bathrooms && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Bath className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-xs text-gray-400">SdB</p>
                      <span className="text-sm font-bold text-gray-900">{listing.bathrooms}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities Section */}
              {(listing.livingRoom || listing.kitchen) && (
                <div className="mb-8 p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    ✨ Équipements
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {listing.livingRoom && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Sofa className="w-4 h-4 text-orange-500" />
                        <span>Salon/Séjour: <span className="font-bold">{listing.livingRoom}</span></span>
                      </div>
                    )}
                    {listing.kitchen && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                        <span>Cuisine: <span className="font-bold">{listing.kitchen}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-3">Description</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>

              {/* Owner Info */}
              {listing.owner && (
                <div className="pt-6 border-t border-gray-100">
                  <h2 className="text-lg font-bold mb-4">Publié par</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-base">
                      {listing.owner.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{listing.owner.fullName}</p>
                      <p className="text-xs text-gray-400">
                        Membre depuis{' '}
                        {listing.owner.createdAt && new Date(listing.owner.createdAt).getTime() > 0
                          ? formatDate(listing.owner.createdAt)
                          : 'récemment'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar with CTA */}
          <div className="w-full lg:w-[380px]">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-orange-100 sticky top-24">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                {typeLabel === 'Location' ? 'Loyer mensuel' : 'Prix de vente'}
              </p>
              <p className="text-4xl font-black text-orange-500 mb-2">{formatPrice(listing.price)}</p>
              {listing.area && (
                <p className="text-sm text-gray-400 mb-8">
                  {Math.round(listing.price / listing.area).toLocaleString('fr-FR')} FCFA / m²
                </p>
              )}

              <div className="flex flex-col gap-3 mb-5">
                <button
                  onClick={handleBuy}
                  disabled={contactLoading}
                  className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-md shadow-orange-100 disabled:opacity-60"
                >
                  {contactLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  Je veux acheter
                </button>

                <button
                  onClick={handleContact}
                  disabled={contactLoading}
                  className="w-full bg-primary-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-600 transition-all shadow-md disabled:opacity-60"
                >
                  {contactLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MessageCircle className="w-5 h-5" />
                  )}
                  Chat avec un agent
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!user) {
                      router.push('/auth/login');
                      return;
                    }
                    favMutation.mutate();
                  }}
                  className={`flex-1 border py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                    favorited
                      ? 'border-red-300 bg-red-50 text-red-500'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500' : ''}`} />
                  {favorited ? 'Favori' : 'Ajouter'}
                </button>
                <button
                  onClick={handleShare}
                  className="px-5 border border-gray-200 py-3 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {listing.publishedAt && new Date(listing.publishedAt).getTime() > 0 && (
                <p className="text-xs text-gray-400 text-center mt-4">
                  Publié le {formatDate(listing.publishedAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Autres biens du vendeur */}
        <OtherListingsFromSeller ownerId={listing.ownerId} currentListingId={listing.id} />

      </main>
      <Footer />
    </div>
  );
}
