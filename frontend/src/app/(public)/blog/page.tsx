'use client';

import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { blogApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['blog', 'posts'],
    queryFn: () => blogApi.getPosts(1),
    select: (r) => r.data,
  });

  const posts = data?.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <header className="bg-gray-50 py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Blog & Conseils</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Toute l'actualité immobilière et nos guides pour réussir vos projets au Cameroun.</p>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full">
        {isLoading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Aucun article pour le moment. Revenez bientôt !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {posts.map((post: any) => (
              <article key={post.id} className="group">
                <Link href={`/blog/${post.slug}`}>
                  <div className="relative h-64 rounded-2xl overflow-hidden mb-6 shadow-md group-hover:shadow-xl transition-all">
                    <img src={post.coverUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&h=300&fit=crop'} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {post.category && (
                      <span className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">{post.category}</span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(post.publishedAt || post.createdAt)}</span>
                  <span className="flex items-center gap-1"><User size={14} /> {post.author?.fullName || 'Keyora'}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-orange-500 transition-colors leading-tight">{post.title}</h2>
                {post.excerpt && <p className="text-gray-500 mb-4 line-clamp-2">{post.excerpt}</p>}
                <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-orange-500 font-bold hover:gap-3 transition-all">
                  Lire l'article <ArrowRight size={18} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
