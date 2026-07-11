import { useState } from 'react';
import { supportApi, usersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, ShieldAlert, CheckCircle, Loader2, Key } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function formatDateTime(value?: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

export function SupportTab({ supportRequests = [], loadingSupport }: any) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'RESOLVED'>('all');
  const [tempPasswordModal, setTempPasswordModal] = useState<{ isOpen: boolean; pass: string; email: string } | null>(null);

  const resolveMutation = useMutation({
    mutationFn: (id: string) => supportApi.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'support'] });
      toast.success('Demande de support marquée comme résolue');
    },
    onError: () => toast.error('Une erreur est survenue'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, email }: { userId: string; email: string }) => 
      usersApi.adminResetPassword(userId).then(r => ({ data: r.data, email })),
    onSuccess: (res) => {
      setTempPasswordModal({
        isOpen: true,
        pass: res.data.temporaryPassword,
        email: res.email,
      });
      toast.success('Mot de passe réinitialisé avec succès');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Impossible de réinitialiser le mot de passe');
    },
  });

  const filtered = supportRequests.filter((r: any) => {
    if (filter !== 'all' && r.status !== filter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900">Demandes de Support ({filtered.length})</h2>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filter === 'all' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Toutes</button>
          <button onClick={() => setFilter('PENDING')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filter === 'PENDING' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>En attente</button>
          <button onClick={() => setFilter('RESOLVED')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filter === 'RESOLVED' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Résolues</button>
        </div>
      </div>

      {loadingSupport ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold text-sm">Aucune demande de support pour le moment.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-150">
                <tr>
                  <th className="px-5 py-3.5 font-bold text-gray-700 text-xs uppercase">Utilisateur / E-mail</th>
                  <th className="px-5 py-3.5 font-bold text-gray-700 text-xs uppercase">Message / Problème</th>
                  <th className="px-5 py-3.5 font-bold text-gray-700 text-xs uppercase">Date de réception</th>
                  <th className="px-5 py-3.5 font-bold text-gray-700 text-xs uppercase">Statut</th>
                  <th className="px-5 py-3.5 font-bold text-gray-700 text-xs uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{r.fullName}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                      {r.userId && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Compte trouvé
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 max-w-xs sm:max-w-md">
                      <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">{r.message}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                    <td className="px-5 py-4">
                      {r.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                          <ShieldAlert className="w-3 h-3" /> En attente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" /> Résolue
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.userId && (
                          <button
                            onClick={() => {
                              if (confirm(`Voulez-vous vraiment réinitialiser le mot de passe de ${r.fullName} ? Un mot de passe temporaire sera généré.`)) {
                                resetPasswordMutation.mutate({ userId: r.userId, email: r.email });
                              }
                            }}
                            className="btn-outline border-purple-200 text-purple-600 hover:bg-purple-50 text-xs py-1 px-2.5 rounded-lg flex items-center gap-1"
                            title="Générer un mot de passe temporaire"
                          >
                            <Key className="w-3.5 h-3.5" /> Réinitialiser
                          </button>
                        )}
                        {r.status === 'PENDING' && (
                          <button
                            onClick={() => resolveMutation.mutate(r.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-1 px-2.5 rounded-lg shadow-sm transition-colors"
                          >
                            Marquer Résolu
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modale d'affichage du mot de passe temporaire */}
      {tempPasswordModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-in zoom-in duration-200">
            <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              🔑 Mot de passe réinitialisé
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-normal">
              Le mot de passe de <strong>{tempPasswordModal.email}</strong> a été réinitialisé. Veuillez lui communiquer ce mot de passe temporaire de connexion :
            </p>
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl mb-5 text-center font-mono text-lg font-black text-purple-700 select-all tracking-wider">
              {tempPasswordModal.pass}
            </div>
            <button
              onClick={() => setTempPasswordModal(null)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-colors"
            >
              Fermer et copier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
