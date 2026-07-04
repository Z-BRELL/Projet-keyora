import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';
import { ShieldCheck, Mail, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

export function ModerationTab({ modQueue, loadingMod, approveMutation, rejectMutation }: any) {
  const { t } = useTranslation();
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t('admin.moderationQueue.title')}</h2>
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${modQueue.length > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          {modQueue.length} {t('admin.stats.pending').toLowerCase()}
        </span>
      </div>

      {loadingMod ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
      ) : modQueue.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ShieldCheck className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{t('admin.moderationQueue.empty')}</p>
          <p className="text-sm text-gray-400">{t('admin.moderationQueue.emptyDesc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modQueue.map((listing: any) => (
            <div key={listing.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{formatPrice(listing.price)}</span>
                    <span>•</span>
                    <span>{listing.city}</span>
                    <span>•</span>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${listing.type === 'SALE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {listing.type === 'SALE' ? t('filters.sale') : t('filters.rent')}
                    </span>
                  </div>
                  {listing.owner && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <Mail className="w-3 h-3" /> {listing.owner.email || '—'}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => approveMutation.mutate(listing.id)} disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    <ThumbsUp className="w-4 h-4" /> {t('admin.moderationQueue.approve')}
                  </button>
                  <button onClick={() => { setRejectModal({ id: listing.id }); setRejectReason(''); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                    <ThumbsDown className="w-4 h-4" /> {t('admin.moderationQueue.reject')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('admin.moderationQueue.reasonTitle')}</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-red-500 outline-none"
              placeholder={t('admin.moderationQueue.reasonPlaceholder')} />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)}
                className="flex-1 bg-gray-100 text-gray-900 font-medium py-2.5 rounded-xl hover:bg-gray-200 text-sm">{t('common.cancel')}</button>
              <button onClick={() => { rejectMutation.mutate({ id: rejectModal.id, reason: rejectReason }); setRejectModal(null); }}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="flex-1 bg-red-500 text-white font-medium py-2.5 rounded-xl hover:bg-red-600 disabled:opacity-50 text-sm">
                {t('admin.moderationQueue.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
