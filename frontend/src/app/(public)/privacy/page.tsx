import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Politique de confidentialité</h1>
        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <p>Chez Keyora, nous accordons une grande importance à la protection de vos données personnelles. Cette politique de confidentialité vous explique comment nous collectons, utilisons et protégeons vos informations.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8">1. Données collectées</h2>
          <p>Nous collectons les informations que vous nous fournissez lors de la création de votre compte : nom, prénom, adresse email, numéro de téléphone. Nous collectons également des données de navigation (adresse IP, pages visitées) pour améliorer votre expérience.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8">2. Utilisation des données</h2>
          <p>Vos données sont utilisées pour : vous permettre de publier et gérer des annonces, vous mettre en relation avec d'autres utilisateurs, vous envoyer des notifications importantes, et améliorer nos services.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8">3. Protection des données</h2>
          <p>Nous mettons en œuvre toutes les mesures techniques et organisationnelles nécessaires pour garantir la sécurité de vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8">4. Vos droits</h2>
          <p>Conformément à la réglementation applicable, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Vous pouvez exercer ces droits en nous contactant à contact@keyora.cm.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8">5. Contact</h2>
          <p>Pour toute question relative à cette politique de confidentialité, vous pouvez nous contacter à contact@keyora.cm.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
