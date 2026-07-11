'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Home, Eye, Heart, Clock, CheckCircle, XCircle,
  Bell, MessageSquare, Plus, Users, ShieldCheck, User, Settings,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { dashboardApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatPrice, statusBadgeClass, statusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useRequireAuth } from '@/lib/useRequireAuth';

function StatCard({ icon, label, value, color = 'primary' }: {
  icon: React.ReactNode; label: string; value: string | number; color?: string;
}) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isMounted } = useRequireAuth();

  const isOwner = ['SELLER', 'SUPERADMIN'].includes(user?.role || '');
  const isAdmin = user?.role === 'SUPERADMIN';
  const isModerator = ['MODERATOR', 'SUPERADMIN'].includes(user?.role || '');

  const { data: ownerData } = useQuery({
    queryKey: ['dashboard', 'owner'],
    queryFn: () => dashboardApi.owner(),
    enabled: isOwner || isAdmin,
    select: (r) => r.data,
  });

  const { data: adminData } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.admin(),
    enabled: isAdmin,
    select: (r) => r.data,
  });

  const { data: buyerData } = useQuery({
    queryKey: ['dashboard', 'buyer'],
    queryFn: () => dashboardApi.buyer(),
    enabled: !isOwner && !isAdmin,
    select: (r) => r.data,
  });

  if (!isMounted || !user) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bonjour, {user.fullName.split(' ')[0]} 👋
              </h1>
              <p className="text-gray-500 mt-0.5">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            {isOwner && (
              <Link href="/sell" className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nouvelle annonce
              </Link>
            )}
            {(isModerator || isAdmin) && (
              <Link href="/dashboard/moderation" className="btn-primary flex items-center gap-2 bg-amber-500 hover:bg-amber-600">
                <ShieldCheck className="w-4 h-4" /> File de modération
              </Link>
            )}
          </div>

          {/* Navigation rapide */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { href: '/dashboard/listings', icon: <Home className="w-5 h-5" />, label: 'Mes annonces', show: isOwner || isAdmin },
              { href: '/dashboard/favorites', icon: <Heart className="w-5 h-5" />, label: 'Favoris', show: true },
              { href: '/dashboard/alerts', icon: <Bell className="w-5 h-5" />, label: 'Alertes', show: true },
              { href: '/dashboard/messages', icon: <MessageSquare className="w-5 h-5" />, label: 'Messages', show: true },
              { href: '/dashboard/profile', icon: <User className="w-5 h-5" />, label: 'Mon Profil', show: true },
              { href: '/dashboard/settings', icon: <Settings className="w-5 h-5" />, label: 'Paramètres', show: true },
              { href: '/dashboard/moderation', icon: <ShieldCheck className="w-5 h-5" />, label: 'Modération', show: isModerator || isAdmin },
              { href: '/dashboard/admin-super', icon: <Users className="w-5 h-5" />, label: 'Admin Panel', show: isAdmin },
            ]
              .filter((n) => n.show)
              .map((nav) => (
                <Link
                  key={nav.href}
                  href={nav.href}
                  className="card p-4 flex flex-col items-center gap-2 text-center hover:border-primary-200 border border-transparent transition-all"
                >
                  <span className="text-primary-500">{nav.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{nav.label}</span>
                </Link>
              ))}
          </div>

          {/* Stats admin */}
          {isAdmin && adminData && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vue d'ensemble</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={<Users className="w-5 h-5" />} label="Utilisateurs" value={adminData.stats.users} color="blue" />
                <StatCard icon={<Home className="w-5 h-5" />} label="Annonces totales" value={adminData.stats.listings} color="primary" />
                <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Publiées" value={adminData.stats.published} color="green" />
                <StatCard icon={<Clock className="w-5 h-5" />} label="En attente" value={adminData.stats.pending} color="yellow" />
              </div>
              {/* Villes */}
              {adminData.listingsByCity?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Annonces par ville</h3>
                  <div className="space-y-2">
                    {adminData.listingsByCity.map((c: any) => (
                      <div key={c.city} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-28 truncate">{c.city}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${Math.min((c.count / (adminData.listingsByCity[0]?.count || 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-8 text-right">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats propriétaire */}
          {isOwner && ownerData && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mes statistiques</h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard icon={<Home className="w-5 h-5" />} label="Annonces totales" value={ownerData.stats.total} />
                <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Publiées" value={ownerData.stats.published} color="green" />
                <StatCard icon={<Clock className="w-5 h-5" />} label="En attente" value={ownerData.stats.pending} color="yellow" />
                <StatCard icon={<XCircle className="w-5 h-5" />} label="Rejetées" value={ownerData.stats.rejected} color="red" />
                <StatCard icon={<Heart className="w-5 h-5" />} label="Mises en favoris" value={ownerData.stats.favorites} color="red" />
                <StatCard icon={<Eye className="w-5 h-5" />} label="Vues totales" value={ownerData.stats.views} color="blue" />
              </div>

              {/* Annonces récentes */}
              {ownerData.recentListings?.length > 0 && (
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Mes dernières annonces</h3>
                    <Link href="/dashboard/listings" className="text-sm text-primary-600 hover:underline">
                      Tout voir
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {ownerData.recentListings.map((l: any) => (
                      <div key={l.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                            <span>{formatPrice(l.price)}</span>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {l.viewCount}</span>
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {l._count?.favorites}</span>
                          </div>
                        </div>
                        <span className={statusBadgeClass(l.status)}>{statusLabel(l.status)}</span>
                        <Link href={`/dashboard/listings/${l.id}`} className="text-xs text-primary-600 hover:underline whitespace-nowrap">
                          Gérer
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats acheteur */}
          {!isOwner && !isAdmin && !isModerator && buyerData && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard icon={<Heart className="w-5 h-5" />} label="Favoris sauvegardés" value={buyerData.stats.favorites} color="red" />
              <StatCard icon={<Bell className="w-5 h-5" />} label="Zones d'alerte" value={buyerData.stats.alerts} color="yellow" />
              <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Messages non lus" value={buyerData.stats.unreadMessages} color="blue" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}