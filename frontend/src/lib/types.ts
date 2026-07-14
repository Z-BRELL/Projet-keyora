// ─────────────────────────────────────────────────────────────────────────────
// Keyora — Types partagés (correspondant au schéma Prisma)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = 'BUYER' | 'SELLER' | 'MODERATOR' | 'SUPERADMIN';

export type ListingStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';

export type ListingType = 'SALE' | 'RENT';

export type PropertyType = 'APARTMENT' | 'HOUSE' | 'LAND' | 'COMMERCIAL';

export type PostStatus = 'DRAFT' | 'PUBLISHED';

// ─── Entités de base ─────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string | null;
  phone?: string | null;
  isVerified?: boolean;
  createdAt?: string;
}

export interface ListingPhoto {
  id: string;
  url: string;
  position: number;
  storageKey?: string | null;
  listingId: string;
  createdAt: string;
}

export interface Listing {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  type: ListingType;
  propertyType?: PropertyType | null;
  city?: string | null;
  address?: string | null;
  area?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  livingRoom?: number | null;
  kitchen?: number | null;
  bathrooms?: number | null;
  floor?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: ListingStatus;
  viewCount: number;
  publishedAt?: string | null;
  rejectionNote?: string | null;
  ownerId: string;
  owner: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'phone' | 'createdAt'>;
  photos: ListingPhoto[];
  isFavorited?: boolean;
  _count?: { favorites: number };
  createdAt: string;
  updatedAt: string;
}

export interface ListingSummary {
  id: string;
  title: string;
  price: number;
  type: ListingType;
  propertyType?: PropertyType | null;
  city?: string | null;
  area?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  status: ListingStatus;
  viewCount: number;
  publishedAt?: string | null;
  owner: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
  photos: Pick<ListingPhoto, 'url' | 'position'>[];
  _count?: { favorites: number };
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  user: Pick<User, 'id' | 'email' | 'fullName' | 'role'>;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
}

export interface LoginDto {
  email: string;
  password: string;
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export interface CreateListingDto {
  title: string;
  description?: string;
  price: number;
  type: ListingType;
  propertyType?: PropertyType;
  city?: string;
  address?: string;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  floor?: number;
  latitude?: number;
  longitude?: number;
}

export interface UpdateListingDto extends Partial<CreateListingDto> {}

export interface ListingQueryDto {
  city?: string;
  type?: ListingType;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  page?: number;
  limit?: number;
  search?: string;
  ownerId?: string;
}

export interface FavoriteStatus {
  favorited: boolean;
}

export interface Favorite {
  userId: string;
  listingId: string;
  savedAt: string;
  listing: Listing;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface PolygonSearchDto {
  polygon: number[][];
  type?: ListingType;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
}

export interface RadiusSearchParams {
  lat: number;
  lng: number;
  radius: number; // en mètres
  type?: ListingType;
  propertyType?: PropertyType;
}

export interface ListingWithDistance extends ListingSummary {
  distance_km: number;
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export interface ModerationLog {
  id: string;
  listingId: string;
  listing: Pick<Listing, 'id' | 'title'>;
  moderatorId: string;
  moderator: Pick<User, 'id' | 'fullName'>;
  action: string;
  reason?: string | null;
  rejectionNote?: string | null;
  createdAt: string;
}

export interface ModerationStats {
  pending: number;
  publishedToday: number;
  rejectedToday: number;
  totalPublished: number;
}

export interface RejectDto {
  reason: string;
}

// ─── Alertes ──────────────────────────────────────────────────────────────────

export interface AlertZoneFilters {
  type?: ListingType;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
}

export interface AlertZone {
  id: string;
  label: string;
  geoJson?: object | null;
  filters?: AlertZoneFilters | null;
  active: boolean;
  userId: string;
  createdAt: string;
  /** Nombre d'annonces publiées correspondant actuellement à cette zone (calculé à la volée). */
  matchCount: number;
}

export interface AlertZoneMatchListing {
  id: string;
  title: string;
  price: number;
  area?: number | null;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  type: ListingType;
  propertyType?: PropertyType | null;
  viewCount: number;
  publishedAt?: string | null;
  cover_photo?: { url: string; position: number } | null;
}

export interface AlertZoneMatches {
  zone: Pick<AlertZone, 'id' | 'label'>;
  count: number;
  listings: AlertZoneMatchListing[];
}

export interface CreateAlertZoneDto {
  label: string;
  geoJson?: object;
  filters?: AlertZoneFilters;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  content: string;
  read: boolean;
  senderId: string;
  sender: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
  recipientId: string;
  listingId?: string | null;
  listing?: Pick<Listing, 'id' | 'title'> | null;
  sentAt: string;
  createdAt: string;
}

export interface Conversation {
  contactId: string;
  contactName: string;
  avatarUrl?: string | null;
  lastMessage: string;
  lastMessageDate: string;
  unread: boolean;
}

export interface SendMessageDto {
  recipientId: string;
  content: string;
  listingId?: string;
}

export interface UnreadCount {
  unread: number;
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverUrl?: string | null;
  category?: string | null;
  status: PostStatus;
  publishedAt?: string | null;
  authorId: string;
  author: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
  categories: { category: BlogCategory }[];
  createdAt: string;
}

export interface CreateBlogPostDto {
  title: string;
  excerpt?: string;
  content: string;
  coverUrl?: string;
  categoryIds?: string[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface OwnerDashboard {
  stats: {
    total: number;
    published: number;
    pending: number;
    rejected: number;
    favorites: number;
    views: number;
  };
  recentListings: ListingSummary[];
}

export interface AdminDashboard {
  stats: {
    users: number;
    listings: number;
    published: number;
    pending: number;
    rejected: number;
    totalUsers: number;
    totalListings: number;
    publishedListings: number;
    pendingListings: number;
    rejectedListings: number;
    blogPosts: number;
    totalViews: number;
    growth: string;
  };
  recentUsers: Array<{
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: string;
    createdAt: string;
    lastLogin: string | null;
    loginCount: number;
  }>;
  listingsByCity: Array<{ city: string; count: number }>;
}

export interface BuyerDashboard {
  stats: {
    favorites: number;
    unreadMessages: number;
    alerts: number;
  };
}

// ─── Réponses génériques ──────────────────────────────────────────────────────

export interface UpdateRoleDto {
  role: Role;
}

export interface ApiMessage {
  message: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
