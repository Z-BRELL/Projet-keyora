'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Menu, X, Home, Search, Bell, MessageSquare, User, LogOut, Shield, LayoutDashboard } from 'lucide-react';
import { useAuthStore, useIsModerator } from '@/lib/store';
import { authApi, messagesApi } from '@/lib/api';
import { useMessageStream } from '@/lib/useMessageStream';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { AuthModal } from '@/components/auth/AuthModal';

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
  useMessageStream({ showToast: false });

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
            <div className="hidden md:flex items-center gap-1">
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
            <div className="hidden md:flex items-center gap-2">
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
                  
                  <Link href="/dashboard" className="btn-ghost flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-sm">{user.fullName.split(' ')[0]}</span>
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost p-2 text-gray-400 hover:text-red-500">
                    <LogOut className="w-4 h-4" />
                  </button>
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
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
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
