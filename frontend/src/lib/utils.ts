import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

export function formatArea(area: number): string {
  return `${area} m²`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function listingTypeLabel(type: string) {
  return type === 'SALE' ? 'Vente' : 'Location';
}

export function propertyTypeLabel(type: string) {
  const map: Record<string, string> = {
    APARTMENT: 'Appartement',
    HOUSE: 'Maison / Villa',
    LAND: 'Terrain',
    COMMERCIAL: 'Commercial',
    OTHER: 'Autre',
  };
  return map[type] || type;
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'Brouillon',
    PENDING: 'En attente',
    PUBLISHED: 'Publié',
    REJECTED: 'Rejeté',
  };
  return map[status] || status;
}

export function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'badge-gray',
    PENDING: 'badge-yellow',
    PUBLISHED: 'badge-green',
    REJECTED: 'badge-red',
  };
  return map[status] || 'badge-gray';
}

export function roleLabel(role: string) {
  const map: Record<string, string> = {
    SELLER: 'Vendeur / Agent',
    BUYER: 'Acheteur',
    MODERATOR: 'Modérateur',
    SUPERADMIN: 'Super Administrateur',
    // Anciens rôles (compatibilité)
    OWNER: 'Propriétaire',
    AGENT: 'Agent immobilier',
    REFERRER: 'Apporteur d\'affaires',
  };
  return map[role] || role;
}

export function getApiError(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Une erreur est survenue'
  );
}
