import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Users, Search, Loader2, Trash2, Pencil, X, Home } from 'lucide-react';
import { usersApi, listingsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/lib/utils';

function formatDateTime(value?: string | null) {
  if (!value) return 'Jamais';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

export function UsersTab({ usersData, loadingUsers, changeRoleMutation }: any) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // User Listings Modal states
  const [viewingUserListings, setViewingUserListings] = useState<any | null>(null);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loadingUserListings, setLoadingUserListings] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: () => toast.error(t('common.error')),
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.adminUpdateProfile(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Profil mis à jour avec succès');
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  const handleEditClick = (u: any) => {
    setEditingUser(u);
    setFullName(u.fullName || '');
    setEmail(u.email || '');
    setPhone(u.phone || '');
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      toast.error('Le nom et l\'adresse e-mail sont obligatoires');
      return;
    }
    updateProfileMutation.mutate({
      id: editingUser.id,
      data: { fullName, email, phone },
    });
  };

  // User listings functions
  const handleViewListings = async (u: any) => {
    setViewingUserListings(u);
    setLoadingUserListings(true);
    try {
      const response = await listingsApi.getUserListingsForAdmin(u.id);
      setUserListings(response.data || []);
    } catch {
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoadingUserListings(false);
    }
  };

  const handleDeleteSingleListing = async (listingId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette annonce ?')) return;
    try {
      await listingsApi.delete(listingId);
      toast.success('Annonce supprimée');
      setUserListings(prev => prev.filter(l => l.id !== listingId));
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'listings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
    } catch {
      toast.error('Impossible de supprimer l\'annonce');
    }
  };

  const handleBulkDeleteListings = async () => {
    if (!viewingUserListings) return;
    const count = userListings.length;
    if (count === 0) return;
    
    const confirmMsg = `ATTENTION : Voulez-vous vraiment supprimer les ${count} annonces de ${viewingUserListings.fullName} ? Cette action est irréversible.`;
    if (!confirm(confirmMsg)) return;

    try {
      await listingsApi.bulkDeleteUserListings(viewingUserListings.id);
      toast.success('Toutes les annonces ont été supprimées');
      setUserListings([]);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'listings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
    } catch {
      toast.error('Erreur lors de la suppression en masse');
    }
  };

  const filteredUsers = usersData.filter((u: any) => {
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    if (userSearch && !u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) && !u.email?.toLowerCase().includes(userSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">{t('admin.users')} ({filteredUsers.length})</h2>
        <div className="flex-1 flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
              placeholder={t('admin.usersTable.searchPlaceholder')} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none">
            <option value="all">{t('admin.roles.all')}</option>
            <option value="BUYER">{t('admin.roles.buyer')}</option>
            <option value="SELLER">{t('admin.roles.seller')}</option>
            <option value="MODERATOR">{t('admin.roles.moderator')}</option>
            <option value="SUPERADMIN">{t('admin.roles.superadmin')}</option>
          </select>
        </div>
      </div>

      {loadingUsers ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('admin.emptyUsers')}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden font-sans">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.name')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.email')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.phone')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.role')}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.listings')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.lastLogin')}</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u: any) => {
                  const listingsCount = u.listingsCount ?? u._count?.listings ?? 0;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3"><p className="font-semibold text-gray-900">{u.fullName}</p></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{u.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <select value={u.role} onChange={(e) => {
                          const confirmMsg = t('admin.usersTable.changeRoleConfirm').replace('{name}', u.fullName).replace('{role}', e.target.value);
                          if (confirm(confirmMsg)) {
                            changeRoleMutation.mutate({ id: u.id, role: e.target.value });
                          }
                        }} disabled={u.role === 'SUPERADMIN'}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer bg-transparent outline-none focus:ring-2 focus:ring-purple-500`}>
                          <option value="BUYER">{t('admin.roles.buyer')}</option>
                          <option value="SELLER">{t('admin.roles.seller')}</option>
                          <option value="MODERATOR">{t('admin.roles.moderator')}</option>
                          {u.role === 'SUPERADMIN' && <option value="SUPERADMIN">{t('admin.roles.superadmin')}</option>}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {listingsCount > 0 ? (
                          <button onClick={() => handleViewListings(u)} className="text-purple-600 hover:text-purple-800 hover:underline font-bold text-xs" title="Voir les annonces">
                            {listingsCount}
                          </button>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(u.lastLogin)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button onClick={() => handleViewListings(u)} className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50 transition-colors inline-flex items-center gap-1 text-xs font-semibold" title="Voir les annonces">
                            <Home className="w-3.5 h-3.5" /> Annonces ({listingsCount})
                          </button>
                          <button onClick={() => handleEditClick(u)} className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors inline-flex items-center gap-1 text-xs font-semibold" title="Modifier le profil">
                            <Pencil className="w-3.5 h-3.5" /> Modifier
                          </button>
                          {u.role !== 'SUPERADMIN' && (
                            <button
                              onClick={() => {
                                if (confirm(t('admin.usersTable.deleteConfirm').replace('{name}', u.fullName))) {
                                  deleteMutation.mutate(u.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View User Listings Modal */}
      {viewingUserListings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative animate-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            <button onClick={() => setViewingUserListings(null)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
              <X size={16} />
            </button>
            
            <div className="mb-4 pr-10">
              <h3 className="text-base font-bold text-gray-900">
                🏡 Annonces de {viewingUserListings.fullName}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{viewingUserListings.email}</p>
            </div>

            {loadingUserListings ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
            ) : userListings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                <Home className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-xs font-semibold">Aucune annonce publiée par cet utilisateur.</p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Total : {userListings.length} annonce(s)</span>
                  <button onClick={handleBulkDeleteListings} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Tout supprimer
                  </button>
                </div>
                
                <div className="overflow-y-auto divide-y divide-gray-100 border border-gray-150 rounded-xl flex-1 max-h-[50vh]">
                  {userListings.map((l: any) => (
                    <div key={l.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/55 transition-colors">
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-xs truncate max-w-xs sm:max-w-md">{l.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                          <span className="font-semibold text-gray-900">{formatPrice(l.price)}</span>
                          <span>📍 {l.city || '—'}</span>
                          <span className="inline-flex scale-90"><StatusBadge status={l.status} /></span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteSingleListing(l.id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors" title="Supprimer cette annonce">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            <div className="mt-5 text-right border-t pt-3">
              <button onClick={() => setViewingUserListings(null)} className="btn-outline text-xs px-4 py-2 rounded-lg">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-in zoom-in duration-200">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4">
              ✏️ Modifier l'utilisateur
            </h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Nom complet</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Adresse Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Téléphone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-2.5 rounded-lg text-sm transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={updateProfileMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-colors">
                  {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
