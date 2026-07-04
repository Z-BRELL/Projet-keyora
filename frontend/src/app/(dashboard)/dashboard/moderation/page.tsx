'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  CheckCircle, XCircle, Eye, Clock, Home,
  Maximize2, BedDouble, Bath, MapPin, User, AlertTriangle, Mail,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { moderationApi } from '@/lib/api';
import { formatPrice, formatDate, propertyTypeLabel } from '@/lib/utils';
import { useAuthStore, useIsModerator } from '@/lib/store';
import { getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';

function RejectModal({ listing, onClose, onConfirm }: {
  listing: any;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const presets = [
    'Photos insuffisantes ou de mauvaise qualité',
    'Description incomplète ou mensongère',
    'Prix non conforme au marché',
    'Bien déjà publié en doublon',
    'Documents manquants (titre foncier, etc.)',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Rejeter l'annonce</h3>
            <p className="text-sm text-gray-500 truncate max-w-xs">{listing.title}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">Motif du rejet (sera envoyé au propriétaire) :</p>
        <div className="space-y-2 mb-4">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setReason(p)}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                reason === p ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Ou saisir un motif personnalisé…"
          className="input resize-none text-sm mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-outline text-sm py-2.5">
            Annuler
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            Rejeter
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ModerationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isModerator = useIsModerator();
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    } else if (!isModerator) {
      router.replace('/dashboard');
    }
  }, [user, isModerator, router]);

  if (!user || !isModerator) return null;

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['moderation', 'queue'],
    queryFn: () => moderationApi.getQueue(),
    select: (r) => r.data,
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['moderation', 'stats'],
    queryFn: () => moderationApi.getStats(),
    select: (r) => r.data,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => moderationApi.approve(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['moderation'] });
      if (selectedListing === id) setSelectedListing(null);
      toast.success('Annonce approuvée et publiée !');
    },
    onError: (err: any) => toast.error(getApiError(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      moderationApi.reject(id, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['moderation'] });
      if (selectedListing === id) setSelectedListing(null);
      setRejectTarget(null);
      toast.success('Annonce rejetée');
    },
    onError: (err: any) => toast.error(getApiError(err)),
  });

  const selected = queue.find((l: any) => l.id === selectedListing);

  return (
    <>
      <Navbar />
      {rejectTarget && (
        <RejectModal
          listing={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => rejectMutation.mutate({ id: rejectTarget.id, reason })}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">File de modération</h1>
            <p className="text-gray-500">Validez ou rejetez les annonces soumises par les propriétaires.</p>
          </div>

          {/* Stats rapides */}
          {stats && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Aperçu</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'En attente', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Publiées', value: stats.publishedToday, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600 bg-green-50' },
                  { label: 'Rejetées', value: stats.rejectedToday, icon: <XCircle className="w-5 h-5" />, color: 'text-red-600 bg-red-50' },
                  { label: 'Total Traité', value: stats.totalPublished, icon: <Home className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50' },
                ].map((s) => (
                  <div key={s.label} className="card p-4 flex items-center gap-3 bg-white rounded-xl border border-gray-200">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-5 animate-pulse flex gap-4">
                  <div className="w-36 h-24 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="card p-16 text-center">
              <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">File vide</h3>
              <p className="text-gray-500">Toutes les annonces ont été traitées. Revenez plus tard.</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Liste */}
              <div className="lg:w-2/5 space-y-3">
                <p className="text-sm text-gray-500 font-medium">
                  {queue.length} annonce{queue.length > 1 ? 's' : ''} en attente
                </p>
                {queue.map((listing: any) => (
                  <div
                    key={listing.id}
                    onClick={() => setSelectedListing(listing.id)}
                    className={`card p-4 cursor-pointer flex gap-3 transition-all ${
                      selectedListing === listing.id ? 'ring-2 ring-primary-500' : 'hover:shadow-card-hover'
                    }`}
                  >
                    {/* Miniature */}
                    <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {listing.photos?.[0]?.url ? (
                        <Image src={listing.photos[0].url} alt="" width={96} height={80} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{listing.title}</p>
                      <p className="text-primary-600 font-semibold text-sm">{formatPrice(listing.price)}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">{listing.owner?.fullName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail className="w-3 h-3" />
                        {/* @ts-ignore */}
                        <span>{listing.owner?.email || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Détail */}
              <div className="lg:flex-1">
                {selected ? (
                  <div className="card p-6 sticky top-28">
                    {/* Photos */}
                    {selected.photos?.length > 0 && (
                      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
                        {selected.photos.map((p: any, i: number) => (
                          <div key={i} className="relative flex-shrink-0 w-40 h-28 rounded-xl overflow-hidden">
                            <Image src={p.url} alt="" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <h2 className="text-xl font-bold text-gray-900 mb-1">{selected.title}</h2>
                    <p className="text-2xl font-bold text-primary-600 mb-4">{formatPrice(selected.price)}</p>

                    {/* Infos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      {[
                        { icon: <Maximize2 className="w-4 h-4" />, label: selected.area + ' m²' },
                        ...(selected.rooms ? [{ icon: <BedDouble className="w-4 h-4" />, label: selected.rooms + ' pièces' }] : []),
                        ...(selected.bathrooms ? [{ icon: <Bath className="w-4 h-4" />, label: selected.bathrooms + ' SDB' }] : []),
                        { icon: <MapPin className="w-4 h-4" />, label: selected.city },
                      ].map((info, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          <span className="text-gray-400">{info.icon}</span>
                          {info.label}
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                      {/* @ts-ignore */}
                      {(selected as any).description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{(selected as any).description}</p>}
                    </div>

                    {/* Propriétaire */}
                    <div className="p-3 bg-gray-50 rounded-xl mb-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 text-sm">
                        {selected.owner?.fullName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selected.owner?.fullName}</p>
                        {/* @ts-ignore */}
                        <p className="text-xs text-gray-500">{selected.owner?.email}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => approveMutation.mutate(selected.id)}
                        disabled={approveMutation.isPending}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {approveMutation.isPending ? 'Approbation…' : 'Approuver'}
                      </button>
                      <button
                        onClick={() => setRejectTarget(selected)}
                        disabled={rejectMutation.isPending}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        <XCircle className="w-5 h-5" />
                        Rejeter
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card p-16 text-center text-gray-400">
                    <Eye className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Sélectionnez une annonce pour la consulter</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
