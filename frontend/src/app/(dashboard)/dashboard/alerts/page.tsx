'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, MapPin, Filter, Pencil, Eye, X, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { ListingCard } from '@/components/listing/ListingCard';
import { alertsApi } from '@/lib/api';
import { formatDate, getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';

const ListingMap = dynamic(
  () => import('@/components/map/ListingMap').then((m) => m.ListingMap),
  { ssr: false },
);

export default function AlertsPage() {
  const { user, isMounted } = useRequireAuth();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [drawnGeo, setDrawnGeo] = useState<any>(null);
  const [label, setLabel] = useState('');
  const [filters, setFilters] = useState({ type: '', minPrice: '', maxPrice: '' });
  const [viewingZone, setViewingZone] = useState<any>(null);

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['alerts', 'zones'],
    queryFn: () => alertsApi.getMyZones(),
    enabled: isMounted && !!user,
    select: (r) => r.data,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => alertsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
      resetForm();
      toast.success('Zone d\'alerte créée !');
    },
    onError: (err: any) => toast.error(getApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => alertsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
      resetForm();
      toast.success('Zone d\'alerte mise à jour !');
    },
    onError: (err: any) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Zone supprimée');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => alertsApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const { data: matches, isLoading: loadingMatches } = useQuery({
    queryKey: ['alerts', 'matches', viewingZone?.id],
    queryFn: () => alertsApi.getMatches(viewingZone.id),
    select: (r) => r.data,
    enabled: !!viewingZone,
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingZone(null);
    setDrawnGeo(null);
    setLabel('');
    setFilters({ type: '', minPrice: '', maxPrice: '' });
  };

  const handleEdit = (zone: any) => {
    setEditingZone(zone);
    setLabel(zone.label);
    setFilters({
      type: zone.filters?.type || '',
      minPrice: zone.filters?.minPrice?.toString() || '',
      maxPrice: zone.filters?.maxPrice?.toString() || '',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!label.trim()) {
      toast.error(t('alerts.nameRequired'));
      return;
    }
    if (!drawnGeo && !editingZone) {
      toast.error(t('alerts.drawError'));
      return;
    }

    const min = filters.minPrice ? parseFloat(filters.minPrice) : null;
    const max = filters.maxPrice ? parseFloat(filters.maxPrice) : null;

    if (min !== null && min < 0) {
      toast.error(t('alerts.priceMinNegative'));
      return;
    }
    if (max !== null && max < 0) {
      toast.error(t('alerts.priceMaxNegative'));
      return;
    }
    if (min !== null && max !== null && min >= max) {
      toast.error(t('alerts.priceMinLessThanMax'));
      return;
    }

    const payload = {
      label,
      ...(drawnGeo ? { geoJson: drawnGeo } : {}),
      filters: {
        type: filters.type || undefined,
        minPrice: filters.minPrice ? +filters.minPrice : undefined,
        maxPrice: filters.maxPrice ? +filters.maxPrice : undefined,
      },
    };

    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!isMounted || !user) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Mes alertes géographiques</h1>
              <p className="text-gray-500">
                Recevez un email dès qu'un bien est publié dans vos zones d'intérêt.
              </p>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle zone
            </button>
          </div>

          {/* Formulaire création / édition */}
          {showForm && (
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                {editingZone ? 'Modifier la zone d\'alerte' : 'Dessiner une nouvelle zone d\'alerte'}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Paramètres */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nom de la zone
                    </label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Ex: Bastos - Yaoundé"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5" /> Filtres (optionnel)
                    </label>
                    <div className="space-y-2">
                      <select
                        value={filters.type}
                        onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                        className="input text-sm"
                      >
                        <option value="">Tous (vente & location)</option>
                        <option value="SALE">Vente uniquement</option>
                        <option value="RENT">Location uniquement</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Prix min (FCFA)"
                        min="0"
                        value={filters.minPrice}
                        onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                        className="input text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Prix max (FCFA)"
                        min="0"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  {drawnGeo || editingZone ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                      ✅ {t('alerts.drawnSuccess')}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                      👆 {t('alerts.drawInstruction')}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={resetForm}
                      className="flex-1 btn-outline text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1 btn-primary text-sm"
                    >
                      {createMutation.isPending || updateMutation.isPending ? 'Enregistrement…' : editingZone ? 'Mettre à jour' : 'Enregistrer'}
                    </button>
                  </div>
                </div>

                {/* Carte de dessin */}
                <div className="lg:col-span-2">
                  <ListingMap
                    showDraw={true}
                    onPolygonSearch={(_, geoJson) => setDrawnGeo(geoJson ?? null)}
                    height="380px"
                    center={[3.8667, 11.5167]}
                  />
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                    <span className="text-blue-500 font-bold flex-shrink-0">ℹ️ {t('alerts.mapInfoTitle')}</span>
                    <div>{t('alerts.mapInfoBody')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Liste des zones */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="card p-5 animate-pulse flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : zones.length === 0 ? (
            <div className="card p-16 text-center">
              <Bell className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucune zone d'alerte</h3>
              <p className="text-gray-500 mb-6">
                Créez votre première zone pour être notifié des nouveaux biens.
              </p>
              <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
                <Plus className="w-4 h-4 mr-2 inline" /> Créer une alerte
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {zones.map((zone: any) => (
                <div
                  key={zone.id}
                  onClick={() => setViewingZone(zone)}
                  className={`card p-5 flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-shadow ${!zone.active ? 'opacity-60' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${zone.active ? 'bg-primary-100' : 'bg-gray-100'}`}>
                    <Bell className={`w-5 h-5 ${zone.active ? 'text-primary-600' : 'text-gray-400'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{zone.label}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {zone.filters?.type && (
                        <span>{zone.filters.type === 'SALE' ? 'Vente' : 'Location'}</span>
                      )}
                      {zone.filters?.minPrice && (
                        <span>Min : {zone.filters.minPrice.toLocaleString('fr-FR')} F</span>
                      )}
                      {zone.filters?.maxPrice && (
                        <span>Max : {zone.filters.maxPrice.toLocaleString('fr-FR')} F</span>
                      )}
                      <span className="flex items-center gap-1 font-semibold text-primary-600">
                        <Eye className="w-3.5 h-3.5" />
                        {zone.matchCount ?? 0} annonce{(zone.matchCount ?? 0) > 1 ? 's' : ''} correspondante{(zone.matchCount ?? 0) > 1 ? 's' : ''}
                      </span>
                      <span>Créé le {formatDate(zone.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(zone); }}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${zone.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {zone.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(zone.id); }}
                      className="text-gray-400 hover:text-primary-600 transition-colors p-1"
                      title={zone.active ? 'Désactiver' : 'Activer'}
                    >
                      {zone.active
                        ? <ToggleRight className="w-6 h-6 text-primary-500" />
                        : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Supprimer cette zone d\'alerte ?')) {
                          deleteMutation.mutate(zone.id);
                        }
                      }}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal : annonces correspondant à une zone */}
      {viewingZone && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingZone(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">{viewingZone.label}</h3>
                <p className="text-sm text-gray-500">
                  {matches ? `${matches.count} annonce${matches.count > 1 ? 's' : ''} correspondante${matches.count > 1 ? 's' : ''}` : 'Chargement…'}
                </p>
              </div>
              <button onClick={() => setViewingZone(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {loadingMatches ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : !matches || matches.listings.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Aucune annonce ne correspond actuellement à cette zone.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.listings.map((listing: any) => (
                    <ListingCard
                      key={listing.id}
                      listing={{ ...listing, photos: listing.cover_photo ? [listing.cover_photo] : [] }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
