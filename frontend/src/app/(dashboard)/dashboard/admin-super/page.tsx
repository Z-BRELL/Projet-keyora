'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { dashboardApi, moderationApi, usersApi, blogApi, supportApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { LayoutDashboard, ShieldCheck, Home, Users, BookOpen, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { OverviewTab } from './components/OverviewTab';
import { ModerationTab } from './components/ModerationTab';
import { ListingsTab } from './components/ListingsTab';
import { UsersTab } from './components/UsersTab';
import { BlogTab } from './components/BlogTab';
import { SupportTab } from './components/SupportTab';

const TABS = [
  { id: 'overview', labelKey: 'admin.overview', icon: LayoutDashboard },
  { id: 'moderation', labelKey: 'admin.moderation', icon: ShieldCheck },
  { id: 'listings', labelKey: 'admin.listings', icon: Home },
  { id: 'users', labelKey: 'admin.users', icon: Users },
  { id: 'support', labelKey: 'admin.support', icon: HelpCircle },
  { id: 'blog', labelKey: 'admin.blog', icon: BookOpen },
] as const;

type TabId = typeof TABS[number]['id'];

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Redirect non-SUPERADMIN
  useEffect(() => {
    setIsMounted(true);
    if (!user) {
      router.push('/auth/login');
    } else if (user.role !== 'SUPERADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Overview Data
  const { data: adminData } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => dashboardApi.admin(),
    select: (r) => r.data,
    enabled: activeTab === 'overview',
  });

  // Moderation Data
  const { data: modQueue = [], isLoading: loadingMod } = useQuery({
    queryKey: ['admin', 'moderation'],
    queryFn: () => moderationApi.getQueue(),
    select: (r) => r.data,
    enabled: activeTab === 'moderation',
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => moderationApi.approve(id),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['admin', 'moderation'] }); 
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] }); 
      toast.success(t('common.save')); 
    },
    onError: () => toast.error(t('common.error')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => moderationApi.reject(id, reason),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['admin', 'moderation'] }); 
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] }); 
      toast.success(t('common.save')); 
    },
    onError: () => toast.error(t('common.error')),
  });

  // Listings Data
  const { data: allListings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['admin', 'listings'],
    queryFn: () => dashboardApi.adminListings(),
    select: (r) => r.data,
    enabled: activeTab === 'listings',
  });

  // Users Data
  const { data: usersData = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => dashboardApi.adminUsers(),
    select: (r) => r.data,
    enabled: activeTab === 'users',
  });

  // Support Data
  const { data: supportRequests = [], isLoading: loadingSupport } = useQuery({
    queryKey: ['admin', 'support'],
    queryFn: () => supportApi.getAll().then(r => r.data || []),
    enabled: activeTab === 'support',
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, { role: role as any }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['admin', 'users'] }); 
      toast.success(t('common.save')); 
    },
    onError: () => toast.error(t('common.error')),
  });

  // Blog Data
  const { data: blogPosts = [], isLoading: loadingBlogs } = useQuery({
    queryKey: ['admin', 'blog'],
    queryFn: () => blogApi.adminGetAll(1, 100).then(r => r.data.data || []),
    enabled: activeTab === 'blog',
  });

  const createBlogMutation = useMutation({
    mutationFn: (data: any) => blogApi.createPost(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'blog'] }); toast.success(t('common.save')); },
    onError: () => toast.error(t('common.error')),
  });

  const updateBlogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => blogApi.updatePost(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'blog'] }); toast.success(t('common.save')); },
    onError: () => toast.error(t('common.error')),
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (id: string) => blogApi.deletePost(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'blog'] }); toast.success(t('common.save')); },
    onError: () => toast.error(t('common.error')),
  });

  if (!isMounted || user?.role !== 'SUPERADMIN') return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
              <p className="text-sm text-gray-500">{user?.fullName} — {t('admin.roles.superadmin')}</p>
            </div>
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              {t('admin.roles.superadmin')}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon className="w-4 h-4" /> 
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && <OverviewTab adminData={adminData} />}
          {activeTab === 'moderation' && (
            <ModerationTab 
              modQueue={modQueue} 
              loadingMod={loadingMod} 
              approveMutation={approveMutation} 
              rejectMutation={rejectMutation} 
            />
          )}
          {activeTab === 'listings' && (
            <ListingsTab 
              allListings={allListings} 
              loadingListings={loadingListings} 
            />
          )}
          {activeTab === 'users' && (
            <UsersTab 
              usersData={usersData} 
              loadingUsers={loadingUsers} 
              changeRoleMutation={changeRoleMutation} 
            />
          )}
          {activeTab === 'support' && (
            <SupportTab 
              supportRequests={supportRequests} 
              loadingSupport={loadingSupport} 
            />
          )}
          {activeTab === 'blog' && (
            <BlogTab 
              blogPosts={blogPosts} 
              loadingBlogs={loadingBlogs} 
              createBlogMutation={createBlogMutation}
              updateBlogMutation={updateBlogMutation}
              deleteBlogMutation={deleteBlogMutation}
            />
          )}
        </div>
      </div>
    </>
  );
}
