'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { MapPin, Mail, Phone, Heart, Home, Eye, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.get(`/users/profile/${userId}`),
    select: (r) => r.data,
  });

  const { data: stats } = useQuery({
    queryKey: ['seller-stats', userId],
    queryFn: () => api.get(`/users/stats/seller/${userId}`),
    select: (r) => r.data,
    enabled: profile?.role === 'SELLER',
  });

  const handleContact = () => {
    if (!currentUser) {
      toast.error('Please login to message');
      router.push('/auth/login');
      return;
    }

    router.push(`/dashboard/messages?sellerId=${userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-500">Profile not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex gap-8 items-start">
            <div className="flex-shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600">
                  {profile.fullName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{profile.fullName}</h1>
              <div className="flex items-center gap-2 text-gray-500 mt-2">
                <Home className="w-4 h-4" />
                <span className="capitalize">{profile.role.toLowerCase()}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>

              <div className="flex gap-3 mt-6">
                {profile.role === 'SELLER' && (
                  <>
                    <button
                      onClick={handleContact}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seller Statistics */}
        {profile.role === 'SELLER' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="text-3xl font-bold text-primary-600">
                {stats.publishedListings}
              </div>
              <p className="text-gray-600 text-sm mt-2">Published Listings</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="text-3xl font-bold text-blue-600">{stats.totalViews}</div>
              <p className="text-gray-600 text-sm mt-2 flex items-center gap-1">
                <Eye className="w-4 h-4" /> Total Views
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="text-3xl font-bold text-red-600">
                {stats.totalFavorites}
              </div>
              <p className="text-gray-600 text-sm mt-2 flex items-center gap-1">
                <Heart className="w-4 h-4" /> Favorites
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="text-3xl font-bold text-green-600">
                {stats.avgResponseTime}m
              </div>
              <p className="text-gray-600 text-sm mt-2">Avg Response Time</p>
            </div>
          </div>
        )}

        {/* Recent Listings */}
        {profile.listings && profile.listings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Properties</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {profile.listings.map((listing: any) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="group cursor-pointer"
                >
                  <div className="bg-gray-200 rounded-lg h-40 mb-3 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <Home className="w-8 h-8 text-gray-500" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {listing.title}
                  </h3>
                  <p className="text-primary-600 font-bold mt-1">
                    {listing.price.toLocaleString()} FCFA
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
