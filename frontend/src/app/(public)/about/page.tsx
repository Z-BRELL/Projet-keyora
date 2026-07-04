'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Target, Users, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-extrabold mb-6">Redéfinir l'immobilier <br/><span className="text-orange-500">au Cameroun.</span></h1>
          <p className="text-xl text-gray-400 leading-relaxed">Keyora est née d'une vision simple : rendre les transactions immobilières transparentes, sécurisées et accessibles à tous grâce à la technologie.</p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Target size={32} /></div>
            <h3 className="text-xl font-bold mb-4">Notre Mission</h3>
            <p className="text-gray-500">Connecter efficacement propriétaires et acheteurs via une plateforme géo-localisée précise.</p>
          </div>
          <div>
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><ShieldCheck size={32} /></div>
            <h3 className="text-xl font-bold mb-4">Notre Valeur</h3>
            <p className="text-gray-500">Chaque annonce est vérifiée manuellement pour garantir une qualité de service irréprochable.</p>
          </div>
          <div>
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Users size={32} /></div>
            <h3 className="text-xl font-bold mb-4">Notre Impact</h3>
            <p className="text-gray-500">Faciliter l'accès à la propriété pour la diaspora et les résidents locaux.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}