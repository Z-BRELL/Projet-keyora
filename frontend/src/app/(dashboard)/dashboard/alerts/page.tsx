'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, MapPin, Filter } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { alertsApi } from '@/lib/api';
import { formatDate, getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';

const ListingMap = dynamic(
  () => import('@/components/map/ListingMap').then((m) => m.ListingMap),
  { ssr: false },
);

export default function AlertsPage() {
  const { user, isMounted } = useRequireAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [drawnGeo, setDrawnGeo] = useState<any>(null);
  const [label, setLabel] = useState('');
  const [filters, setFilters] = useState({ type: '', minPrice: '', maxPrice: '' });

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
      setShowForm(false);
      setDrawnGeo(null);
      setLabel('');
      toast.success('Zone d\'alerte créée !');
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

  const handleSave = () => {
    if (!label.trim()) { toast.error('Donnez un nom à votre zone'); return; }
    if (!drawnGeo) { toast.error('Dessinez une zone sur la carte'); return; }
    createMutation.mutate({
      label,
      geoJson: drawnGeo,
      filters: {
        type: filters.type || undefined,
        minPrice: filters.minPrice ? +filters.minPrice : undefined,
        maxPrice: filters.maxPrice ? +filters.maxPrice : undefined,
      },
    });
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
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle zone
            </button>
          </div>

          {/* Formulaire création */}
          {showForm && (
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                Dessiner une nouvelle zone d'alerte
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
                        value={filters.minPrice}
                        onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                        className="input text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Prix max (FCFA)"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  {drawnGeo ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                      ✅ Zone dessinée sur la carte
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                      👆 Utilisez l'outil polygone (carré) sur la carte pour dessiner votre zone
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 btn-outline text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={createMutation.isPending || !drawnGeo}
                      className="flex-1 btn-primary text-sm"
                    >
                      {createMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
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
                  <p className="text-xs text-gray-400 mt-2">
                    Cliquez sur l'icône rectangle/polygone en haut à droite de la carte pour dessiner.
                  </p>
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
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus className="w-4 h-4 mr-2 inline" /> Créer une alerte
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {zones.map((zone: any) => (
                <div key={zone.id} className={`card p-5 flex items-center gap-4 ${!zone.active ? 'opacity-60' : ''}`}>
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
                      <span>{zone._count?.matches || 0} match(s)</span>
                      <span>Créé le {formatDate(zone.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${zone.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {zone.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => toggleMutation.mutate(zone.id)}
                      className="text-gray-400 hover:text-primary-600 transition-colors p-1"
                      title={zone.active ? 'Désactiver' : 'Activer'}
                    >
                      {zone.active
                        ? <ToggleRight className="w-6 h-6 text-primary-500" />
                        : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(zone.id)}
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
    </>
  );
}
