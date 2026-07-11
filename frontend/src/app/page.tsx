import type { Metadata } from 'next';
import HomeContent from './home-content';

export const metadata: Metadata = {
  title: 'Keyora | Annonces Immobilières au Cameroun - Vente, Achat, Location',
  description: 'Trouvez le bien de vos rêves au Cameroun. Des milliers d\'annonces vérifiées de maisons, appartements et terrains à vendre ou à louer à Yaoundé, Douala et plus.',
};

export default function Page() {
  return <HomeContent />;
}