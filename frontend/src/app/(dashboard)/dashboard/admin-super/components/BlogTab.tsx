import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FileText, Plus, Eye, Edit, Trash2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function BlogTab({ 
  blogPosts, loadingBlogs, createBlogMutation, updateBlogMutation, deleteBlogMutation 
}: any) {
  const { t } = useTranslation();
  
  const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', category: '', status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' });
  const [showNewBlogModal, setShowNewBlogModal] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<any>(null);

  function resetBlogForm() { 
    setBlogForm({ title: '', excerpt: '', content: '', category: '', status: 'DRAFT' }); 
  }

  function handleBlogSubmit() {
    if (!blogForm.title.trim() || !blogForm.content.trim()) { toast.error('Titre et contenu requis'); return; }
    if (editingBlogPost) updateBlogMutation.mutate({ id: editingBlogPost.id, data: blogForm });
    else createBlogMutation.mutate(blogForm);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.blog')}</h2>
          <p className="text-sm text-gray-500">{blogPosts.length} {t('admin.stats.blogPosts').toLowerCase()}</p>
        </div>
        <button onClick={() => { resetBlogForm(); setEditingBlogPost(null); setShowNewBlogModal(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> {t('admin.blogTable.new')}
        </button>
      </div>

      {loadingBlogs ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
      ) : blogPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('admin.emptyBlog')}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.blogTable.article')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.blogTable.category')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.blogTable.status')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.blogTable.views')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.blogTable.date')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">{t('admin.blogTable.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {blogPosts.map((post: any) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.coverUrl && <img src={post.coverUrl} alt="" className="w-10 h-10 rounded object-cover" />}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[250px]">{post.title}</p>
                          {post.excerpt && <p className="text-xs text-gray-500 truncate max-w-[250px]">{post.excerpt}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{post.category || 'Général'}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={post.status} /></td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{post.viewCount || 0}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(post.publishedAt || post.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          updateBlogMutation.mutate({ id: post.id, data: { ...post, status: post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' } });
                        }} className="text-gray-400 hover:text-gray-600 p-1" title="Basculer statut"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setEditingBlogPost(post); setBlogForm({ title: post.title, excerpt: post.excerpt || '', content: post.content, category: post.category || '', status: post.status }); setShowNewBlogModal(true); }}
                          className="text-gray-400 hover:text-gray-600 p-1" title={t('common.edit')}><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm('Supprimer cet article ?')) deleteBlogMutation.mutate(post.id); }}
                          className="text-gray-400 hover:text-red-600 p-1" title={t('common.delete')}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNewBlogModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingBlogPost ? t('common.edit') : t('admin.blogTable.new')}</h2>
              <button onClick={() => { setShowNewBlogModal(false); setEditingBlogPost(null); resetBlogForm(); }} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Titre *</label>
                <input type="text" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} className="input" placeholder="Titre de l'article" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Catégorie</label>
                <input type="text" value={blogForm.category} onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })} className="input" placeholder="Investissement, Guide..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Extrait</label>
                <textarea value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} className="input" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Contenu *</label>
                <textarea value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} className="input" rows={8} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Statut</label>
                <select value={blogForm.status} onChange={(e) => setBlogForm({ ...blogForm, status: e.target.value as any })} className="input">
                  <option value="DRAFT">{t('admin.status.draft')}</option>
                  <option value="PUBLISHED">{t('admin.status.published')}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => { setShowNewBlogModal(false); setEditingBlogPost(null); resetBlogForm(); }}
                  className="flex-1 bg-gray-100 text-gray-900 font-medium py-2.5 rounded-xl hover:bg-gray-200 text-sm">{t('common.cancel')}</button>
                <button onClick={handleBlogSubmit}
                  disabled={!blogForm.title.trim() || !blogForm.content.trim() || createBlogMutation.isPending || updateBlogMutation.isPending}
                  className="flex-1 bg-purple-600 text-white font-medium py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 text-sm">
                  {createBlogMutation.isPending || updateBlogMutation.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> En cours...</span> : editingBlogPost ? t('common.save') : t('admin.blogTable.new')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
