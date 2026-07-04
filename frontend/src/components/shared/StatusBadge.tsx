import { useTranslation } from '@/lib/i18n';

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const styles: Record<string, string> = {
    PUBLISHED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    REJECTED: 'bg-red-100 text-red-700',
    DRAFT: 'bg-gray-100 text-gray-600',
  };
  
  // Dynamic translation key based on status
  let label = status;
  if (status === 'PUBLISHED') label = t('admin.status.published');
  if (status === 'PENDING') label = t('admin.status.pending');
  if (status === 'REJECTED') label = t('admin.status.rejected');
  if (status === 'DRAFT') label = t('admin.status.draft');

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {label}
    </span>
  );
}
