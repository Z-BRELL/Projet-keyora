import axios from 'axios';
import { useAuthStore } from './store';
import type {
  AuthTokens,
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  Listing,
  ListingSummary,
  ListingQueryDto,
  CreateListingDto,
  UpdateListingDto,
  PaginatedResponse,
  FavoriteStatus,
  Favorite,
  PolygonSearchDto,
  RadiusSearchParams,
  ListingWithDistance,
  ModerationLog,
  ModerationStats,
  AlertZone,
  CreateAlertZoneDto,
  Message,
  Conversation,
  SendMessageDto,
  UnreadCount,
  BlogPost,
  BlogCategory,
  CreateBlogPostDto,
  OwnerDashboard,
  AdminDashboard,
  BuyerDashboard,
  ApiMessage,
  UpdateRoleDto,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          refreshToken ? { refreshToken } : {},
          { withCredentials: true },
        );
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        
        // 👇 La magie anti-boucle : on ne redirige QUE si on n'est pas déjà sur l'accueil
        if (window.location.pathname !== '/') {
          window.location.href = '/'; 
        }
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data: RegisterDto) =>
    api.post<ApiMessage & { userId: string }>('/auth/register', data),
  login: (data: LoginDto) =>
    api.post<AuthTokens>('/auth/login', data),
  logout: () =>
    api.post<ApiMessage>('/auth/logout'),
  me: () =>
    api.get<AuthTokens['user']>('/auth/me'),
  refresh: (data?: Partial<RefreshTokenDto>) =>
    api.post<Pick<AuthTokens, 'accessToken' | 'refreshToken'>>('/auth/refresh', data ?? {}),
  resendVerification: (email: string) =>
    api.post<ApiMessage>('/auth/resend-verification', { email }),
};

export const listingsApi = {
  getAll: (params?: ListingQueryDto) =>
    api.get<PaginatedResponse<ListingSummary>>('/listings', { params }),
  getOne: (id: string) =>
    api.get<Listing>(`/listings/${id}`),
  create: (data: CreateListingDto) =>
    api.post<Listing>('/listings', data),
  update: (id: string, data: UpdateListingDto) =>
    api.patch<Listing>(`/listings/${id}`, data),
  delete: (id: string) =>
    api.delete<ApiMessage>(`/listings/${id}`),
  submit: (id: string) =>
    api.post<Listing>(`/listings/${id}/submit`),
  uploadPhotos: (id: string, files: FormData) =>
    api.post<{ photos: { url: string }[] }>(`/listings/${id}/photos`, files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  toggleFavorite: (id: string) =>
    api.post<FavoriteStatus>(`/listings/${id}/favorite`),
  getFavorites: () =>
    api.get<Favorite[]>('/listings/user/favorites'),
  getMyListings: () =>
    api.get<ListingSummary[]>('/listings/user/my-listings'),
  getUserListingsForAdmin: (userId: string) =>
    api.get<any[]>(`/listings/admin/user-listings/${userId}`),
  bulkDeleteUserListings: (userId: string) =>
    api.delete<ApiMessage>(`/listings/admin/bulk-delete/${userId}`),
};

export const searchApi = {
  byPolygon: (data: PolygonSearchDto) =>
    api.post<ListingSummary[]>('/search/polygon', data),
  byRadius: (params: RadiusSearchParams) =>
    api.get<ListingWithDistance[]>('/search/radius', { params }),
  cities: (q: string) =>
    api.get<string[]>('/search/cities', { params: { q } }),
};

export const moderationApi = {
  getQueue: () =>
    api.get<ListingSummary[]>('/moderation/queue'),
  approve: (id: string) =>
    api.post<ApiMessage>(`/moderation/listings/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.post<ApiMessage>(`/moderation/listings/${id}/reject`, { reason }),
  getLogs: (page = 1) =>
    api.get<PaginatedResponse<ModerationLog>>('/moderation/logs', { params: { page } }),
  getStats: () =>
    api.get<ModerationStats>('/moderation/stats'),
};

export const alertsApi = {
  create: (data: CreateAlertZoneDto) =>
    api.post<AlertZone>('/alerts/zones', data),
  getMyZones: () =>
    api.get<AlertZone[]>('/alerts/zones'),
  update: (id: string, data: Partial<CreateAlertZoneDto>) =>
    api.patch<AlertZone>(`/alerts/zones/${id}`, data),
  toggle: (id: string) =>
    api.patch<AlertZone>(`/alerts/zones/${id}/toggle`),
  delete: (id: string) =>
    api.delete<ApiMessage>(`/alerts/zones/${id}`),
};

export const messagesApi = {
  send: (data: SendMessageDto) =>
    api.post<Message>('/messages', data),
  getConversations: () =>
    api.get<Conversation[]>('/messages/conversations'),
  getThread: (contactId: string) =>
    api.get<Message[]>(`/messages/thread/${contactId}`),
  getUnread: () =>
    api.get<UnreadCount>('/messages/unread'),
  getOrCreateConversation: (sellerId: string, listingId?: string) =>
    api.get(`/messages/or-create/${sellerId}`, { params: { listingId } }),
  deleteMessage: (messageId: string) =>
    api.delete<ApiMessage>(`/messages/${messageId}`),
  deleteMessageForMe: (messageId: string) =>
    api.post<ApiMessage>(`/messages/${messageId}/delete-for-me`),
  deleteMessageForEveryone: (messageId: string) =>
    api.post<ApiMessage>(`/messages/${messageId}/delete-for-everyone`),
  clearConversation: (contactId: string) =>
    api.post<ApiMessage>(`/messages/${contactId}/clear`),
};

export const notificationsApi = {
  getAll: () =>
    api.get<any[]>('/notifications'),
  markAsRead: (id: string) =>
    api.patch<any>(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.patch<any>('/notifications/read-all'),
  delete: (id: string) =>
    api.delete<any>(`/notifications/${id}`),
};

export const blogApi = {
  getPosts: (page = 1) =>
    api.get<PaginatedResponse<BlogPost>>('/blog/posts', { params: { page } }),
  getPost: (slug: string) =>
    api.get<BlogPost>(`/blog/posts/${slug}`),
  getCategories: () =>
    api.get<BlogCategory[]>('/blog/categories'),
  createPost: (data: CreateBlogPostDto) =>
    api.post<BlogPost>('/blog/posts', data),
  updatePost: (id: string, data: Partial<CreateBlogPostDto>) =>
    api.patch<BlogPost>(`/blog/posts/${id}`, data),
  deletePost: (id: string) =>
    api.delete<ApiMessage>(`/blog/posts/${id}`),
  adminGetAll: (page = 1, limit = 10, status?: string) =>
    api.get<PaginatedResponse<BlogPost>>('/blog/admin/all', { params: { page, limit, status } }),
};

export const usersApi = {
  updateRole: (id: string, data: UpdateRoleDto) =>
    api.patch(`/users/${id}/role`, data),
  deleteUser: (id: string) =>
    api.delete<ApiMessage>(`/users/${id}`),
  search: (q: string) =>
    api.get<any[]>('/users/search', { params: { q } }),
  adminUpdateProfile: (id: string, data: any) =>
    api.patch(`/users/admin/profile/${id}`, data),
  adminResetPassword: (id: string) =>
    api.patch(`/users/admin/reset-password/${id}`),
};

export const supportApi = {
  create: (data: { fullName: string; email: string; message: string }) =>
    api.post('/support-requests', data),
  getAll: () =>
    api.get('/support-requests'),
  resolve: (id: string) =>
    api.patch(`/support-requests/${id}/resolve`),
};

export const dashboardApi = {
  owner: () => api.get<OwnerDashboard>('/dashboard/owner'),
  admin: () => api.get<AdminDashboard>('/dashboard/admin'),
  buyer: () => api.get<BuyerDashboard>('/dashboard/buyer'),
  adminUsers: () => api.get('/dashboard/admin/users'),
  adminListings: () => api.get('/dashboard/admin/listings'),
};