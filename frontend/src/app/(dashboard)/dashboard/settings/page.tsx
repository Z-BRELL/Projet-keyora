'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Loader2, LogOut, Trash2, AlertCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isMounted } = useRequireAuth();
  const { logout } = useAuthStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.delete('/users/profile'),
    onSuccess: () => {
      toast.success('Compte supprimé avec succès');
      logout();
      router.push('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du compte');
    },
  });

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isMounted || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-black text-gray-900 mb-8">Paramètres du compte</h1>

        {/* Profile Settings Redirect Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-500">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Informations du profil</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Modifiez votre nom, email, téléphone et photo de profil.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-center text-sm transition-all shadow-md shadow-orange-100 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            Modifier mon profil
          </Link>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sécurité</h2>

          <div className="space-y-4">
            <Link
              href="/dashboard/settings/change-password"
              className="block p-4 border border-gray-200 rounded-xl hover:bg-orange-50/30 hover:border-orange-200 transition-all"
            >
              <p className="font-semibold text-gray-900">Changer le mot de passe</p>
              <p className="text-xs text-gray-400 mt-1">Mettre à jour votre mot de passe de connexion</p>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full p-4 border border-gray-200 rounded-xl hover:bg-orange-50/30 hover:border-orange-200 transition-all text-left flex items-center justify-between group"
            >
              <div>
                <p className="font-semibold text-gray-900">Se déconnecter</p>
                <p className="text-xs text-gray-400 mt-1">Déconnexion de cet appareil</p>
              </div>
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-red-950">Zone de danger</h2>
              <p className="text-sm text-red-700 mt-1">
                Actions permanentes et irréversibles
              </p>
            </div>
          </div>

          {showDeleteConfirm ? (
            <div className="space-y-4">
              <p className="text-red-900 font-medium">
                Êtes-vous sûr ? Cette action supprimera définitivement votre compte et toutes vos données associées.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => deleteAccountMutation.mutate()}
                  disabled={deleteAccountMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteAccountMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Oui, supprimer mon compte
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-white border border-red-300 text-red-900 font-semibold py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full p-4 border-2 border-red-200 hover:border-red-300 rounded-lg hover:bg-red-100/50 transition-colors text-left"
            >
              <p className="font-semibold text-red-900">Supprimer mon compte</p>
              <p className="text-xs text-red-700 mt-1">Supprimer définitivement votre compte Keyora</p>
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
