'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { blogApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Loader2, Calendar, User, ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: post, isLoading, error, isError } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => blogApi.getPost(slug),
    select: (r) => r.data,
    enabled: !!slug,
    retry: 1,
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <Link href="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour au blog
        </Link>

        {isLoading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
        ) : isError || !post ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Article introuvable</h2>
            <p className="text-gray-500">{(error as any)?.response?.data?.message || "Cet article n'existe pas ou a été supprimé."}</p>
          </div>
        ) : (
          <article>
            {post.coverUrl && (
              <img src={post.coverUrl} alt={post.title} className="w-full h-80 object-cover rounded-2xl mb-8 shadow-lg" />
            )}
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString('fr-FR')}</span>
              <span className="flex items-center gap-1"><User className="w-4 h-4" /> {post.author?.fullName || 'Admin'}</span>
              {post.category && <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> {post.category}</span>}
            </div>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
              {post.content}
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
