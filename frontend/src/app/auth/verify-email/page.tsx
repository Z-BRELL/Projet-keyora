'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { setAuth } = useAuthStore();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const { data } = await authApi.verifyEmail(token);
        setAuth(data.user, data.accessToken, data.refreshToken);
        setStatus('success');
        setMessage('Email vérifié avec succès ! Connexion automatique en cours...');
        setTimeout(() => router.push('/dashboard'), 2000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Erreur lors de la vérification de votre email.');
      }
    };

    verifyEmail();
  }, [token, router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Vérification en cours...</h1>
            <p className="text-gray-600">Veuillez patienter pendant la vérification de votre email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email vérifié! ✅</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-6">Redirection vers la connexion dans 3 secondes...</p>
            <Link 
              href="/auth/login" 
              className="inline-block bg-primary-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Se connecter maintenant
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur de vérification</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link 
                href="/auth/login" 
                className="inline-block bg-primary-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-600 transition-colors w-full"
              >
                Se connecter
              </Link>
              <Link 
                href="/" 
                className="inline-block bg-gray-100 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors w-full"
              >
                Retour à l'accueil
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
