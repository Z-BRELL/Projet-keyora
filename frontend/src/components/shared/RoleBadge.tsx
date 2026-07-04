import { useTranslation } from '@/lib/i18n';

export const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: 'bg-purple-100 text-purple-700',
  MODERATOR: 'bg-amber-100 text-amber-700',
  SELLER: 'bg-blue-100 text-blue-700',
  BUYER: 'bg-green-100 text-green-700',
};

export function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation();
  
  let label = role;
  if (role === 'SUPERADMIN') label = t('admin.roles.superadmin');
  if (role === 'MODERATOR') label = t('admin.roles.moderator');
  if (role === 'SELLER') label = t('admin.roles.seller');
  if (role === 'BUYER') label = t('admin.roles.buyer');

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-700'}`}>
      {label}
    </span>
  );
}
