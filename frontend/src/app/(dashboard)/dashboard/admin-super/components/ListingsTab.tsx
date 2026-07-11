import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { formatDate, formatPrice } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Home, Loader2, Pencil, X } from 'lucide-react';
import { listingsApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function ListingsTab({ allListings, loadingListings }: any) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [listingFilter, setListingFilter] = useState('all');
  const [editingListing, setEditingListing] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [ownerId, setOwnerId] = useState('');

  const filteredListings = allListings.filter((l: any) => listingFilter === 'all' || l.status === listingFilter);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => listingsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'listings'] });
      toast.success('Annonce mise à jour avec succès');
      setEditingListing(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de la modification');
    },
  });

  const handleEditClick = (l: any) => {
    setEditingListing(l);
    setTitle(l.title || '');
    setPrice(l.price?.toString() || '');
    setCity(l.city || '');
    setOwnerId(l.ownerId || l.owner?.id || '');
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !ownerId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    updateMutation.mutate({
      id: editingListing.id,
      data: {
        title,
        price: Number(price),
        city,
        ownerId,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">{t('admin.listings')} ({filteredListings.length})</h2>
        <div className="flex gap-2">
          {['all', 'PUBLISHED', 'PENDING', 'REJECTED', 'DRAFT'].map((f) => (
            <button key={f} onClick={() => setListingFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                listingFilter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f === 'all' ? t('admin.status.all') : t(`admin.status.${f.toLowerCase()}`)}
            </button>
          ))}
        </div>
      </div>

      {loadingListings ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('admin.emptyListings')}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('listings.price').replace('Prix', 'Titre')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.name').replace('Nom', 'Propriétaire')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('listings.price')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">Ville</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.blogTable.status')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.blogTable.date')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.blogTable.views')}</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredListings.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]" title={l.title}>{l.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      <p className="font-semibold text-gray-800">{l.owner?.fullName || '—'}</p>
                      <p className="text-gray-500 text-[10px]">{l.owner?.email || '—'}</p>
                      {l.owner?.phone && <p className="text-gray-500 text-[10px]">{l.owner.phone}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{formatPrice(l.price)}</td>
                    <td className="px-4 py-3 text-gray-600">{l.city || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{l.viewCount ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEditClick(l)} className="text-purple-600 hover:text-purple-800 p-1.5 hover:bg-purple-50 rounded transition-colors inline-flex items-center gap-1" title="Modifier l'annonce">
                        <Pencil className="w-3.5 h-3.5" /> Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in zoom-in duration-200">
            <button onClick={() => setEditingListing(null)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4">
              ✏️ Modifier l'annonce
            </h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Titre de l'annonce</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Prix (FCFA)</label>
                <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Ville</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">ID Propriétaire</label>
                <input type="text" required value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                  Changer cet ID réassignera l'annonce à cet utilisateur. Ses coordonnées (téléphone, e-mail) apparaîtront automatiquement sur la fiche.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setEditingListing(null)} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-2.5 rounded-lg text-sm transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-colors">
                  {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
