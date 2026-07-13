'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, X, Home, Search, Bell, MessageSquare, User, LogOut, Shield, LayoutDashboard } from 'lucide-react';
import { useAuthStore, useIsModerator } from '@/lib/store';
import { authApi, messagesApi, notificationsApi } from '@/lib/api';
import { useNotificationStream } from '@/lib/useNotificationStream';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { AuthModal } from '@/components/auth/AuthModal';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Navigation links
const navLinks = [
  { href: '/listing', label: 'Listing' },
  { href: '/listing?type=SALE', label: 'Acheter' },
  { href: '/sell', label: 'Vendre' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'Qui sommes-nous ?' },
];

// Message Badge Component with Unread Count
// Mise à jour temps réel via SSE (useMessageStream dans Navbar)
function MessageBadge() {
  const { data: unreadData } = useQuery({
    queryKey: ['unread'],
    queryFn: async () => {
      try {
        const response = await messagesApi.getUnread();
        return response.data || response;
      } catch {
        return { unread: 0 };
      }
    },
  });

  const unreadCount = unreadData?.unread || 0;

  return (
    <Link href="/dashboard/messages" className="btn-ghost p-2 relative hover:bg-gray-100 rounded-lg transition-colors">
      <MessageSquare className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

function NotificationBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [], refetch } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const response = await notificationsApi.getAll();
        return Array.isArray(response.data) ? response.data : response.data || [];
      } catch {
        return [];
      }
    },
  });

  useNotificationStream({
    showToast: true,
    onNotification: () => {
      refetch();
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="btn-ghost p-2 relative hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5 text-gray-700 hover:text-orange-500 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-sm text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllReadMutation.mutate()} 
                className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors"
              >
                Tout lire
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                Aucune notification pour le moment.
              </div>
            ) : (
              notifications.map((n: any) => {
                let icon = '🔔';
                let iconBg = 'bg-orange-50 text-orange-500';
                if (n.type === 'MESSAGE') {
                  icon = '💬';
                  iconBg = 'bg-blue-50 text-blue-500';
                } else if (n.type === 'MODERATION') {
                  icon = '🛡️';
                  iconBg = 'bg-red-50 text-red-500';
                } else if (n.type === 'ALERT') {
                  icon = '📍';
                  iconBg = 'bg-emerald-50 text-emerald-500';
                }

                return (
                  <div 
                    key={n.id} 
                    className={`p-4 flex gap-3 transition-colors hover:bg-gray-50 relative group ${!n.read ? 'bg-orange-50/20' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center text-sm flex-shrink-0`}>
                      {icon}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className={`text-xs font-semibold text-gray-800 truncate ${!n.read ? 'font-bold' : ''}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-normal mb-1 break-words">
                        {n.content}
                      </p>
                      {n.link && (
                        <Link 
                          href={n.link} 
                          onClick={() => {
                            if (!n.read) markReadMutation.mutate(n.id);
                            setIsOpen(false);
                          }}
                          className="text-[10px] text-orange-500 hover:text-orange-600 font-bold transition-colors inline-flex items-center gap-0.5"
                        >
                          Voir les détails →
                        </Link>
                      )}
                    </div>
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => deleteMutation.mutate(n.id)}
                        className="text-gray-400 hover:text-red-500 text-xs p-1 rounded hover:bg-gray-100"
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'login' | 'register'>('login');
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const isModerator = useIsModerator();
  const isAdmin = user?.role === 'SUPERADMIN';

  // Temps réel pour le badge de messages non lus
  // Plus de useMessageStream, géré globalement ou par SocketProvider

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    clearAuth();
    toast.success('Déconnexion réussie');
    router.push('/');
  };

  const openAuthModal = (view: 'login' | 'register') => {
    setModalView(view);
    setIsModalOpen(true);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-primary-600">Keyora</span>
            </Link>

            {/* Nav Desktop */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href.split('?')[0] && !link.href.includes('?')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <>
                  {isModerator && (
                    <Link href="/dashboard/moderation" className="btn-ghost flex items-center gap-1.5 text-amber-600 hover:bg-amber-50">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Modération</span>
                    </Link>
                  )}
                  
                  {isAdmin && (
                    <Link href="/dashboard/admin-super" className="btn-ghost flex items-center gap-1.5 text-indigo-600 hover:bg-indigo-50">
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="text-sm">Admin</span>
                    </Link>
                  )}
                  
                  <MessageBadge />
                  <NotificationBadge />
                  
                  <div className="relative group">
                    <button className="btn-ghost flex items-center gap-1.5 focus:outline-none py-2 px-3 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-primary-600 transition-colors">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-semibold">{user.fullName.split(' ')[0]}</span>
                    </button>
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 hidden group-hover:block hover:block z-50">
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                        Tableau de bord
                      </Link>
                      <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                        Mon Profil
                      </Link>
                      <Link href="/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                        Paramètres
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Se déconnecter
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => openAuthModal('login')} className="text-gray-600 font-bold hover:text-primary-600 transition-colors text-sm px-3">
                    Connexion
                  </button>
                  <button onClick={() => openAuthModal('register')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-xl transition-all shadow-sm text-sm">
                    Inscription
                  </button>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2.5 rounded-xl text-sm font-medium',
                  pathname === link.href.split('?')[0] && !link.href.includes('?')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50',
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              {user ? (
                <>
                  {isModerator && (
                    <Link href="/dashboard/moderation" onClick={() => setMobileOpen(false)} className="btn-outline text-center text-sm text-amber-600">
                      Modération
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/dashboard/admin-super" onClick={() => setMobileOpen(false)} className="btn-outline text-center text-sm text-indigo-600">
                      Admin Panel
                    </Link>
                  )}
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="btn-outline text-center text-sm">
                    Tableau de bord
                  </Link>
                  <Link href="/dashboard/profile" onClick={() => setMobileOpen(false)} className="btn-outline text-center text-sm">
                    Mon Profil
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setMobileOpen(false)} className="btn-outline text-center text-sm">
                    Paramètres
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost text-sm text-red-500">
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => openAuthModal('login')} className="w-full border border-gray-300 rounded-xl py-2 font-bold text-gray-700 text-sm">
                    Connexion
                  </button>
                  <button onClick={() => openAuthModal('register')} className="w-full bg-orange-500 rounded-xl py-2 font-bold text-white text-sm">
                    Inscription
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialView={modalView} 
      />
    </>
  );
}
