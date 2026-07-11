'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, User, Briefcase, Home, Eye, EyeOff, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, supportApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  
  const [view, setView] = useState<'login' | 'register' | 'support' | 'verification-pending'>(initialView);
  const [loading, setLoading] = useState(false);

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [showPassword, setShowPassword] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === 'register') {
        if (password.length < 8) {
          toast.error('Le mot de passe doit contenir au moins 8 caractères');
          setLoading(false);
          return;
        }
        await authApi.register({ fullName, email, phone, password, role });
        
        try {
          const { data } = await authApi.login({ email, password });
          setAuth(data.user, data.accessToken, data.refreshToken);
          toast.success('Compte créé avec succès ! Vous êtes connecté.');
          onClose();
          router.push('/dashboard');
        } catch (loginErr: any) {
          const errorMsg = loginErr?.response?.data?.message || '';
          if (errorMsg.includes('non vérifié') || errorMsg.includes('Vérifiez votre e-mail') || errorMsg.includes('validation')) {
            setView('verification-pending');
          } else {
            toast.success('Compte créé ! Veuillez vérifier vos e-mails pour l\'activer.');
            setView('login');
          }
        }
      } else {
        try {
          const { data } = await authApi.login({ email, password });
          setAuth(data.user, data.accessToken, data.refreshToken);
          toast.success(`Bon retour, ${data.user.fullName.split(' ')[0]} !`);
          onClose();
          
          if (data.user.role === 'MODERATOR' || data.user.role === 'SUPERADMIN') {
            router.push('/dashboard/moderation');
          } else {
            router.push('/dashboard');
          }
        } catch (loginErr: any) {
          const errorMsg = loginErr?.response?.data?.message || '';
          if (errorMsg.includes('non vérifié') || errorMsg.includes('Vérifiez votre e-mail') || errorMsg.includes('validation')) {
            setView('verification-pending');
          } else {
            throw loginErr;
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supportApi.create({ fullName, email, message: supportMessage });
      toast.success('Votre demande a été transmise au support. Nous vous répondrons par e-mail.');
      setSupportMessage('');
      setView('login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm transition-all font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Bouton Fermer */}
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors z-10">
          <X size={18} />
        </button>

        <div className="p-6">
          
          {view === 'verification-pending' ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                <Mail size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900">Vérifiez votre e-mail ✉️</h3>
              <p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto">
                Un e-mail de confirmation a été envoyé à <strong className="text-gray-900">{email}</strong>. 
                Veuillez cliquer sur le lien dans l'e-mail pour activer votre compte.
              </p>
              <div className="pt-2 space-y-2">
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await authApi.resendVerification(email);
                      toast.success('Un nouvel e-mail de confirmation a été envoyé.');
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || 'Erreur lors du renvoi');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? 'Renvoyer...' : "Renvoyer l'e-mail de confirmation"}
                </button>
                
                <button
                  onClick={() => setView('login')}
                  className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg text-xs transition-all"
                >
                  Retour à la connexion
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Home size={24} />
                </div>
                <h2 className="text-xl font-black text-gray-900">
                  {view === 'login' ? 'Connexion' : view === 'register' ? 'Rejoindre Keyora' : 'Support client'}
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                  {view === 'login' 
                    ? 'Heureux de vous revoir' 
                    : view === 'register' 
                      ? 'Commencez votre aventure immobilière' 
                      : 'Problème de connexion ou réinitialisation de compte'}
                </p>
              </div>

              {view === 'support' ? (
                <form onSubmit={handleSupportSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Nom complet</label>
                    <input type="text" required placeholder="Ex: Jean Dupont" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Adresse Email</label>
                    <input type="email" required placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Message explicatif</label>
                    <textarea required rows={4} placeholder="Décrivez votre problème (ex: réinitialisation de mot de passe requis)..." value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm resize-none" />
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 mt-2 text-sm">
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? 'Envoi...' : 'Envoyer ma demande'}
                  </button>

                  <div className="mt-4 text-center">
                    <button type="button" onClick={() => setView('login')} className="text-xs text-orange-500 hover:underline font-bold">
                      Retour à la connexion
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    
                    {/* Champs spécifiques à l'inscription */}
                    {view === 'register' && (
                      <>
                        <div className="mb-1">
                          <label className="text-xs font-bold text-gray-700 mb-1.5 block">Je suis un...</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setRole('BUYER')}
                              className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition-all text-sm ${
                                role === 'BUYER' ? 'border-orange-500 bg-orange-50 text-orange-600 font-bold' : 'border-gray-200 text-gray-700 hover:border-orange-200 hover:text-gray-900'
                              }`}
                            >
                              <User size={16} /> Acheteur
                            </button>
                            <button
                              type="button"
                              onClick={() => setRole('SELLER')}
                              className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition-all text-sm ${
                                role === 'SELLER' ? 'border-orange-500 bg-orange-50 text-orange-600 font-bold' : 'border-gray-200 text-gray-700 hover:border-orange-200 hover:text-gray-900'
                              }`}
                            >
                              <Briefcase size={16} /> Vendeur
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Nom complet</label>
                          <input type="text" required placeholder="Ex: Jean Mbarga" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Téléphone</label>
                          <input type="tel" required placeholder="+237 6XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" />
                        </div>
                      </>
                    )}

                    {/* Champs communs (Email & Mot de passe) */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Email</label>
                      <input type="email" required placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Mot de passe</label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} required placeholder={view === 'register' ? "8 caractères minimum" : "••••••••"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 mt-2 text-sm">
                      {loading && <Loader2 size={16} className="animate-spin" />}
                      {view === 'login' ? (loading ? 'Connexion...' : 'Se connecter') : (loading ? 'Création...' : 'Créer mon compte')}
                    </button>
                  </form>

                  {/* Liens de navigation */}
                  <div className="mt-5 text-center flex flex-col gap-2.5 text-xs text-gray-500 font-medium">
                    <div>
                      {view === 'login' ? (
                        <>
                          Pas encore de compte ?{' '}
                          <button type="button" onClick={() => setView('register')} className="text-orange-500 hover:underline font-bold">
                            S'inscrire
                          </button>
                        </>
                      ) : (
                        <>
                          Déjà un compte ?{' '}
                          <button type="button" onClick={() => setView('login')} className="text-orange-500 hover:underline font-bold">
                            Se connecter
                          </button>
                        </>
                      )}
                    </div>
                    {view === 'login' && (
                      <div>
                        <button type="button" onClick={() => setView('support')} className="text-gray-400 hover:text-orange-500 font-bold hover:underline transition-colors">
                          Problème de connexion ? Contacter le support
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}