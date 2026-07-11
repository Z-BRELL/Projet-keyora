'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Search, MapPin } from "lucide-react";

export default function HomeContent() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<'SALE' | 'RENT'>('SALE');
  const [searchCity, setSearchCity] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('type', searchType);
    if (searchCity.trim()) params.set('search', searchCity.trim());
    router.push(`/listing?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[550px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&h=500&fit=crop')", 
            backgroundSize: "cover", 
            backgroundPosition: "center" 
          }}
        />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <div className="inline-block bg-orange-500/20 text-orange-300 px-4 py-2 rounded-full mb-4 text-sm font-semibold">
            🏠 N°1 de l'immobilier au Cameroun
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2">Trouvez votre</h1>
          <h2 className="text-5xl md:text-6xl font-bold text-orange-500 mb-6">bien idéal</h2>

          <p className="text-gray-300 text-lg max-w-2xl mb-10 leading-relaxed">
            Des milliers d'annonces vérifiées pour acheter, vendre ou louer en toute confiance.
          </p>

          {/* Barre de recherche stylisée */}
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl p-4 md:p-6 transition-all">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchType('SALE')}
                  className={`px-6 py-3 rounded-lg font-bold transition-all ${searchType === 'SALE' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Acheter
                </button>
                <button
                  onClick={() => setSearchType('RENT')}
                  className={`px-6 py-3 rounded-lg font-bold transition-all ${searchType === 'RENT' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Louer
                </button>
              </div>

              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Ville, quartier..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 outline-none"
                />
              </div>

              <button
                onClick={handleSearch}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all"
              >
                <Search size={20} />
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
            {[
              { label: "Annonces publiées", val: "3 891" },
              { label: "Utilisateurs inscrits", val: "1 247" },
              { label: "Vues générées", val: "892K" },
              { label: "Satisfaction", val: "98%" }
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-extrabold text-gray-900">{stat.val}</p>
                <p className="text-gray-500 font-medium mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="bg-orange-500 py-20 text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">Vous vendez ou louez un bien ?</h2>
          <p className="text-xl mb-10 opacity-90 leading-relaxed">
            Rejoignez plus de 1 200 propriétaires et agents qui nous font confiance pour trouver leurs clients rapidement.
          </p>
          <Link href="/sell" className="bg-white text-orange-600 hover:bg-gray-100 px-10 py-4 rounded-xl font-extrabold text-lg transition-transform hover:scale-105 inline-block shadow-xl">
            Publier une annonce gratuite
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
