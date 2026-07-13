import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from './types';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  /**
   * Stocke l'utilisateur dans le state Zustand.
   *
   * IMPORTANT — Solution 4 (JWT HttpOnly cookies) :
   * Les tokens JWT ne sont PLUS stockés dans localStorage.
   * Ils sont désormais gérés comme cookies HttpOnly par le serveur.
   * Le frontend conserve uniquement les données utilisateur non-sensibles.
   *
   * Compatibilité : Si des tokens sont passés, ils sont stockés dans
   * localStorage UNIQUEMENT si les cookies ne sont pas supportés.
   */
  setAuth: (user: User, accessToken?: string, refreshToken?: string) => void;
  clearAuth: () => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      setAuth: (user, accessToken, refreshToken) => {
        // Le token n'est stocké en localStorage QUE si fourni explicitement
        // (compatibilité avec les clients n'utilisant pas les cookies)
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        } else {
          // Nettoyage propre si on passe en mode cookie
          localStorage.removeItem('accessToken');
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        } else {
          localStorage.removeItem('refreshToken');
        }
        set({ user });
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ user: null });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ user: null });
      },

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'keyora-auth',
      // Persiste uniquement les données utilisateur non-sensibles
      partialize: (s) => ({ user: s.user }),
    },
  ),
);

// ─── Helpers de rôle ─────────────────────────────────────────────────────────

export const useIsAdmin = () =>
  useAuthStore((s) => s.user?.role === 'SUPERADMIN');

export const useIsModerator = () =>
  useAuthStore((s) => s.user?.role === 'MODERATOR' || s.user?.role === 'SUPERADMIN');

export const useIsOwner = () =>
  useAuthStore((s) => ['SELLER', 'SUPERADMIN'].includes(s.user?.role ?? ''));

export const useIsBuyer = () =>
  useAuthStore((s) => s.user?.role === 'BUYER');
