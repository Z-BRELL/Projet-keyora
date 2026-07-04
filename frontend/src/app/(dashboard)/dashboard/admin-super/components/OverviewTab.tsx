import { useTranslation } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { Users, Home, CheckCircle, Clock, AlertCircle, BookOpen, Eye, ArrowUpDown } from 'lucide-react';

interface OverviewTabProps {
  adminData: any;
}

export function OverviewTab({ adminData }: OverviewTabProps) {
  const { t } = useTranslation();

  if (!adminData) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: t('admin.stats.users'), value: adminData.stats.totalUsers, color: 'blue' },
          { icon: Home, label: t('admin.stats.listings'), value: adminData.stats.totalListings, color: 'primary' },
          { icon: CheckCircle, label: t('admin.stats.published'), value: adminData.stats.publishedListings, color: 'green' },
          { icon: Clock, label: t('admin.stats.pending'), value: adminData.stats.pendingListings, color: 'yellow' },
          { icon: AlertCircle, label: t('admin.stats.rejected'), value: adminData.stats.rejectedListings, color: 'red' },
          { icon: BookOpen, label: t('admin.stats.blogPosts'), value: adminData.stats.blogPosts, color: 'purple' },
          { icon: Eye, label: t('admin.stats.views'), value: adminData.stats.totalViews, color: 'blue' },
          { icon: ArrowUpDown, label: t('admin.stats.growth'), value: adminData.stats.growth, color: 'green' },
        ].map((s, i) => {
          let bgColor = 'bg-primary-50 text-primary-600';
          if (s.color === 'green') bgColor = 'bg-green-50 text-green-600';
          else if (s.color === 'yellow') bgColor = 'bg-yellow-50 text-yellow-600';
          else if (s.color === 'red') bgColor = 'bg-red-50 text-red-600';
          else if (s.color === 'blue') bgColor = 'bg-blue-50 text-blue-600';
          else if (s.color === 'purple') bgColor = 'bg-purple-50 text-purple-600';

          return (
            <div key={i} className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm border border-gray-100">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">{t('admin.recentUsers')}</h3>
          {adminData.recentUsers?.length > 0 ? (
            <div className="space-y-3">
              {adminData.recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{u.fullName}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <div><RoleBadge role={u.role} /></div>
                    <div className="mt-0.5">{formatDate(u.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">{t('admin.emptyUsers')}</p>}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">{t('admin.listingsByCity')}</h3>
          {adminData.listingsByCity?.length > 0 ? (
            <div className="space-y-2">
              {adminData.listingsByCity.map((c: any) => (
                <div key={c.city} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28 truncate">{c.city}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min((c.count / Math.max(adminData.listingsByCity[0]?.count, 1)) * 100, 100)}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{c.count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">{t('admin.emptyListings')}</p>}
        </div>
      </div>
    </div>
  );
}
