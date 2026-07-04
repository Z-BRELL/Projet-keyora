import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { formatDate, formatPrice } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Home, Loader2 } from 'lucide-react';

export function ListingsTab({ allListings, loadingListings }: any) {
  const { t } = useTranslation();
  const [listingFilter, setListingFilter] = useState('all');

  const filteredListings = allListings.filter((l: any) => listingFilter === 'all' || l.status === listingFilter);

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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredListings.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><p className="font-medium text-gray-900 truncate max-w-[200px]">{l.title}</p></td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{l.owner?.fullName || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{formatPrice(l.price)}</td>
                    <td className="px-4 py-3 text-gray-600">{l.city || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{l.viewCount ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
