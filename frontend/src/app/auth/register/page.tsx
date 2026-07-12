'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Loader2, Mail, Eye, EyeOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import type { Role } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'BUYER',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Nouveaux états pour le modal de vérification
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      await authApi.register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role as Role,
      });

      // Au lieu de rediriger, on affiche le modal de vérification
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authApi.resendVerification(formData.email);
      toast.success('E-mail renvoyé avec succès. Vérifiez votre boîte de réception (et vos spams).');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors du renvoi');
    } finally {
      setResendLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-5 rounded-full ring-8 ring-green-50">
              <Mail className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Vérifiez votre boîte mail</h2>
          
          <p className="text-gray-600 mb-6 text-sm md:text-base">
            Nous avons envoyé un lien de confirmation sécurisé à l'adresse :<br />
            <strong className="text-gray-900 block mt-2 p-2 bg-gray-50 rounded border border-gray-100">{formData.email}</strong>
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            Veuillez cliquer sur ce lien pour activer votre compte et accéder à toutes les fonctionnalités de Keyora.
            <br/><br/>
            <span className="italic">Pensez à vérifier vos courriers indésirables (spams) si vous ne trouvez pas l'e-mail.</span>
          </p>

          <div className="space-y-3">
             <Link 
                href="/auth/login" 
                className="flex items-center justify-center w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
             >
               Aller à la page de connexion
             </Link>
             
             <button
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2 group"
             >
                {resendLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                )}
                Je n'ai rien reçu, renvoyer l'e-mail
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="bg-primary-500 p-3 rounded-full">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">S'inscrire</h1>
        <p className="text-gray-600 text-center mb-6">Créez votre compte Keyora gratuitement</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nom complet</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Jean Dupont"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Téléphone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+237123456789"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Je suis...</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="BUYER">Un acheteur</option>
              <option value="SELLER">Un vendeur/agent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Confirmer le mot de passe</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Inscription en cours...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                S'inscrire
              </>
            )
            }
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            Déjà inscrit?{' '}
            <Link href="/auth/login" className="text-primary-500 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Mail className="w-3 h-3" />
          <span>Vérification d'email requise</span>
        </div>
      </div>
    </div>
  );
}
