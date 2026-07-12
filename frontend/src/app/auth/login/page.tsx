'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await authApi.resendVerification(email);
      toast.success('Lien d\'activation envoyé ! Vérifiez votre boîte mail.');
      setShowResend(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du renvoi du lien.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResend(false);

    try {
      const { data } = await authApi.login({ email, password });

      setAuth(data.user, data.accessToken, data.refreshToken);

      toast.success('Connexion réussie!');
      
      if (data.user.role === 'SUPERADMIN') {
        router.push('/dashboard/admin-super');
      } else if (data.user.role === 'MODERATOR') {
        router.push('/dashboard/moderation');
      } else if (data.user.role === 'SELLER') {
        router.push('/dashboard/listings');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || '';
      toast.error(msg || 'Erreur lors de la connexion');
      if (msg.toLowerCase().includes('non vérifié') || msg.toLowerCase().includes('activation') || msg.toLowerCase().includes('email')) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="bg-primary-500 p-3 rounded-full">
            <LogIn className="w-6 h-6 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Connexion</h1>
        <p className="text-gray-600 text-center mb-6">Accédez à votre compte Keyora</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Se connecter
              </>
            )}
          </button>
        </form>

        {showResend && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
            <p className="text-sm text-orange-800 mb-2">Votre compte n'est pas encore activé.</p>
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="text-sm text-primary-500 font-bold hover:underline disabled:opacity-50"
            >
              {resending ? 'Envoi en cours...' : "Renvoyer l'e-mail d'activation"}
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            Pas encore inscrit?{' '}
            <Link href="/auth/register" className="text-primary-500 font-semibold hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700">
            Mot de passe oublié?
          </Link>
        </div>
      </div>
    </div>
  );
}
