'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Loader2, Camera, Save, ArrowLeft, User, Mail, Phone, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const { isMounted } = useRequireAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    avatarUrl: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/profile').then((r) => r.data),
    enabled: isMounted && !!user,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        avatarUrl: profile.avatarUrl || '',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => api.patch('/users/profile', data),
    onSuccess: (res) => {
      toast.success('Profil mis à jour avec succès');
      // Synchronisation avec Zustand et la Navbar
      if (res?.data) {
        setAuth(res.data);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Le nom complet est requis.');
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  if (!isMounted || !user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
        <Footer />
      </div>
    );
  }

  // Fallback avatar avec les initiales
  const initials = formData.fullName
    ? formData.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        {/* Navigation retour */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-500 font-semibold mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
        </Link>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Mon Profil</h1>
        <p className="text-gray-500 mb-8">Gérez vos informations personnelles et votre identité sur Keyora.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Colonne latérale - Avatar & Rôle */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 w-full flex flex-col items-center text-center">
              <div className="relative w-28 h-28 mb-4 group rounded-full overflow-hidden border-4 border-orange-50 bg-gray-100 flex items-center justify-center shadow-inner">
                {formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt={formData.fullName} 
                    className="w-full h-full object-cover"
                    onError={() => setFormData({ ...formData, avatarUrl: '' })}
                  />
                ) : (
                  <span className="text-3xl font-black text-orange-500">{initials}</span>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <h2 className="font-bold text-gray-900 text-lg leading-tight mb-1">{formData.fullName || 'Utilisateur'}</h2>
              <p className="text-sm text-gray-400 mb-3">{formData.email}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user.role}
              </div>
            </div>
            
            <Link 
              href="/dashboard/settings" 
              className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl text-center text-sm transition-colors border border-gray-200"
            >
              Sécurité & Paramètres
            </Link>
          </div>

          {/* Formulaire d'édition */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" /> Informations du compte
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Nom complet *</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ex: Jean Dupont"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-900 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Adresse e-mail *</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Ex: jean.dupont@email.com"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-900 font-medium"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Modifier l'email peut nécessiter une nouvelle vérification.</p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Numéro de téléphone</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ex: +237 6xx xxx xxx"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Photo de profil (URL)</label>
                  <div className="relative">
                    <Camera className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                    <input 
                      type="url" 
                      value={formData.avatarUrl}
                      onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-900 font-medium"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2 text-md disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Enregistrer les modifications
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
