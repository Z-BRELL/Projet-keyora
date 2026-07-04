import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { Users, Search, Loader2, Trash2 } from 'lucide-react';
import { usersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function formatDateTime(value?: string | null) {
  if (!value) return 'Jamais';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

export function UsersTab({ usersData, loadingUsers, changeRoleMutation }: any) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(t('common.save').replace('Enregistrer', 'Utilisateur supprimé'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const filteredUsers = usersData.filter((u: any) => {
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    if (userSearch && !u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) && !u.email?.toLowerCase().includes(userSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">{t('admin.users')} ({filteredUsers.length})</h2>
        <div className="flex-1 flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
              placeholder={t('admin.usersTable.searchPlaceholder')} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none">
            <option value="all">{t('admin.roles.all')}</option>
            <option value="BUYER">{t('admin.roles.buyer')}</option>
            <option value="SELLER">{t('admin.roles.seller')}</option>
            <option value="MODERATOR">{t('admin.roles.moderator')}</option>
            <option value="SUPERADMIN">{t('admin.roles.superadmin')}</option>
          </select>
        </div>
      </div>

      {loadingUsers ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('admin.emptyUsers')}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.name')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.email')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.phone')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.role')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.listings')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.lastLogin')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.usersTable.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><p className="font-medium text-gray-900">{u.fullName}</p></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={(e) => {
                        const confirmMsg = t('admin.usersTable.changeRoleConfirm').replace('{name}', u.fullName).replace('{role}', e.target.value);
                        if (confirm(confirmMsg)) {
                          changeRoleMutation.mutate({ id: u.id, role: e.target.value });
                        }
                      }} disabled={u.role === 'SUPERADMIN'}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer bg-transparent outline-none focus:ring-2 focus:ring-purple-500`}>
                        <option value="BUYER">{t('admin.roles.buyer')}</option>
                        <option value="SELLER">{t('admin.roles.seller')}</option>
                        <option value="MODERATOR">{t('admin.roles.moderator')}</option>
                        {u.role === 'SUPERADMIN' && <option value="SUPERADMIN">{t('admin.roles.superadmin')}</option>}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center"><span className="font-semibold text-gray-700">{u.listingsCount ?? u._count?.listings ?? 0}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(u.lastLogin)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{u.loginCount || 0} connexions</span>
                        {u.role !== 'SUPERADMIN' && (
                          <button
                            onClick={() => {
                              if (confirm(t('admin.usersTable.deleteConfirm').replace('{name}', u.fullName))) {
                                deleteMutation.mutate(u.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
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
