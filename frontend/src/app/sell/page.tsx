'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle, Home, MapPin, FileText, DollarSign, ImagePlus, X, Building, Loader2, Ruler, Bed, Sofa, UtensilsCrossed, Bath } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { listingsApi } from '@/lib/api';

export default function SellPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: 'SALE',
    propertyType: 'HOUSE',
    price: '',
    city: '',
    address: '',
    description: '',
    area: '',
    rooms: '',
    bedrooms: '',
    livingRoom: '',
    kitchen: '',
    bathrooms: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    let message = '';

    if (name === 'title' && !value.trim()) message = 'Le titre est requis.';
    if (name === 'price' && (!value || Number(value) <= 0)) message = 'Le prix doit être supérieur à 0.';
    if (name === 'city' && !value.trim()) message = 'La ville est requise.';
    if (name === 'description' && value.trim().length < 20) message = 'Décrivez le bien avec au moins 20 caractères.';
    if (['area', 'rooms', 'bedrooms', 'livingRoom', 'kitchen', 'bathrooms'].includes(name) && value && Number(value) < 0) {
      message = 'La valeur doit être positive.';
    }

    setErrors((current) => ({
      ...current,
      [name]: message,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      if (images.length + selectedFiles.length > 10) {
        toast.error("Vous ne pouvez pas ajouter plus de 10 photos.");
        return;
      }

      setImages(prev => [...prev, ...selectedFiles]);
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!formData.title.trim()) nextErrors.title = 'Le titre est requis.';
    if (!formData.price || Number(formData.price) <= 0) nextErrors.price = 'Le prix doit être supérieur à 0.';
    if (!formData.city.trim()) nextErrors.city = 'La ville est requise.';
    if (!formData.description.trim() || formData.description.trim().length < 20) {
      nextErrors.description = 'Décrivez le bien avec au moins 20 caractères.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Corrigez les champs signalés avant de soumettre.');
      return;
    }

    if (!user) {
      toast.error('Vous devez être connecté pour soumettre une annonce.');
      router.push('/auth/login');
      return;
    }

    if (!formData.title.trim() || !formData.price || !formData.city.trim() || !formData.description.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires avant de soumettre.');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Création de votre annonce en cours...");

    try {
      const listingData = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        type: formData.type as 'SALE' | 'RENT',
        propertyType: formData.propertyType as 'APARTMENT' | 'HOUSE' | 'LAND' | 'COMMERCIAL',
        city: formData.city,
        address: formData.address || undefined,
        area: formData.area ? Number(formData.area) : undefined,
        rooms: formData.rooms ? Number(formData.rooms) : undefined,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        livingRoom: formData.livingRoom ? Number(formData.livingRoom) : undefined,
        kitchen: formData.kitchen ? Number(formData.kitchen) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
      };

      const res = await listingsApi.create(listingData);
      const newListingId = res.data.id;

      if (images.length > 0) {
        toast.loading("Envoi des photos...", { id: loadingToast });
        const imageFormData = new FormData();
        images.forEach(file => imageFormData.append('photos', file));
        await listingsApi.uploadPhotos(newListingId, imageFormData);
      }

      toast.loading("Soumission à l'équipe de modération...", { id: loadingToast });
      await listingsApi.submit(newListingId);

      toast.success('Félicitations ! Votre annonce est en attente de modération.', { id: loadingToast });
      
      router.push('/dashboard');

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Une erreur est survenue lors de la publication.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-24 pb-12 w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Publiez votre annonce</h1>
          <p className="text-gray-500 text-lg">Vendez ou louez votre bien immobilier rapidement sur Keyora.</p>
        </div>

        {!user && (
          <div className="bg-blue-50 border border-blue-200 p-5 mb-8 rounded-2xl flex items-start gap-4 shadow-sm">
            <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-1">Connexion requise</h3>
              <p className="text-sm text-blue-800">
                Vous pouvez préparer votre annonce, mais vous devrez vous connecter pour la publier finalement. <br/>
                <Link href="/auth/login" className="font-bold underline hover:text-blue-600 transition-colors mt-2 inline-block">
                  Se connecter ou s'inscrire
                </Link>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-8">
          
          {/* Section 1: Informations de base */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Home className="w-5 h-5 text-orange-500" /> Informations de base
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-gray-700 mb-2 block">Titre de l'annonce *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Belle villa 4 pièces avec piscine" 
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({...formData, title: e.target.value});
                    validateField('title', e.target.value);
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  required
                />
                {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Type de transaction *</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer"
                >
                  <option value="SALE">À Vendre</option>
                  <option value="RENT">À Louer</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4 text-orange-500" /> Type de bien *
                </label>
                <select 
                  value={formData.propertyType}
                  onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer"
                >
                  <option value="HOUSE">Maison / Villa</option>
                  <option value="APARTMENT">Appartement</option>
                  <option value="LAND">Terrain</option>
                  <option value="COMMERCIAL">Local Commercial</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-500" /> Prix (FCFA) *
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 50000000" 
                  value={formData.price}
                  onChange={(e) => {
                    setFormData({...formData, price: e.target.value});
                    validateField('price', e.target.value);
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  required
                />
                {errors.price && <p className="mt-2 text-sm text-red-600">{errors.price}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Localisation */}
          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" /> Localisation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Ville *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Yaoundé" 
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({...formData, city: e.target.value});
                    validateField('city', e.target.value);
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  required
                />
                {errors.city && <p className="mt-2 text-sm text-red-600">{errors.city}</p>}
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Quartier / Adresse</label>
                <input 
                  type="text" 
                  placeholder="Ex: Bastos, face Ambassade" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Détails du bien */}
          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-orange-500" /> Détails du bien
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-orange-500" /> Surface (m²) *
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 250" 
                  value={formData.area}
                  onChange={(e) => {
                    setFormData({...formData, area: e.target.value});
                    validateField('area', e.target.value);
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Home className="w-4 h-4 text-orange-500" /> Nombre total de pièces *
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 6" 
                  value={formData.rooms}
                  onChange={(e) => {
                    setFormData({...formData, rooms: e.target.value});
                    validateField('rooms', e.target.value);
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Bed className="w-4 h-4 text-orange-500" /> Chambres *
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 3" 
                  value={formData.bedrooms}
                  onChange={(e) => {
                    setFormData({...formData, bedrooms: e.target.value});
                    validateField('bedrooms', e.target.value);
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Sofa className="w-4 h-4 text-orange-500" /> Salon / Séjour *
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 1" 
                  value={formData.livingRoom}
                  onChange={(e) => {
                    setFormData({...formData, livingRoom: e.target.value});
                    validateField('livingRoom', e.target.value);
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-orange-500" /> Cuisine *
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 1" 
                  value={formData.kitchen}
                  onChange={(e) => {
                    setFormData({...formData, kitchen: e.target.value});
                    validateField('kitchen', e.target.value);
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Bath className="w-4 h-4 text-orange-500" /> Salle de bain *
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 2" 
                  value={formData.bathrooms}
                  onChange={(e) => {
                    setFormData({...formData, bathrooms: e.target.value});
                    validateField('bathrooms', e.target.value);
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 4: Description */}
          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" /> Description
            </h2>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Description détaillée *</label>
            <textarea 
              rows={5}
              placeholder="Décrivez votre bien en détail (équipements, état, caractéristiques spéciales...)" 
              value={formData.description}
              onChange={(e) => {
                setFormData({...formData, description: e.target.value});
                validateField('description', e.target.value);
              }}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
              required
            ></textarea>
            {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Section 5: Photos */}
          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-orange-500" /> Photos du bien
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold">La première photo</span> sera l'image de façade/extérieur. Les autres mettront en avant les détails intérieurs. (Maximum 10 photos)
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {previews.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 group">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Façade
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {previews.length < 10 && (
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-all">
                  <ImagePlus className="text-gray-400 mb-2" size={24}/>
                  <span className="text-xs text-gray-500 font-medium">Ajouter</span>
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleImageChange} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp" 
                  />
                </label>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={loading || !user}
              className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-lg
                ${loading || !user ? 'bg-gray-300 cursor-not-allowed text-gray-500 shadow-none' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200'}`}
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={24} /> Publication en cours...</>
              ) : (
                <><CheckCircle size={24} /> Soumettre mon annonce</>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">
              * Tous les champs marqués d'un astérisque sont obligatoires.
            </p>
          </div>
        </form>
      </main>
      
      <Footer />
    </div>
  );
}
