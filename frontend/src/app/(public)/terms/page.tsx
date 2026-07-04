import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Conditions générales d'utilisation</h1>
        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <p>Les présentes conditions générales d'utilisation régissent l'accès et l'utilisation de la plateforme Keyora. En utilisant nos services, vous acceptez ces conditions.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8">1. Services proposés</h2>
          <p>Keyora est une plateforme de mise en relation entre vendeurs, acheteurs et locataires de biens immobiliers. Nous facilitons la publication d'annonces et la mise en contact des utilisateurs.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8">2. Obligations des utilisateurs</h2>
          <p>Les utilisateurs s'engagent à fournir des informations exactes et à ne pas publier de contenu frauduleux, illégal ou offensant. Chaque annonce doit correspondre à un bien réel et disponible.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8">3. Modération</h2>
          <p>Keyora se réserve le droit de modérer, suspendre ou supprimer toute annonce qui ne respecterait pas les présentes conditions. Les annonces sont soumises à validation avant publication.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8">4. Responsabilité</h2>
          <p>Keyora agit comme intermédiaire et ne peut être tenu responsable des transactions entre utilisateurs. Nous recommandons de toujours vérifier les biens avant tout engagement.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8">5. Modification des CGU</h2>
          <p>Nous nous réservons le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés de tout changement significatif.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
