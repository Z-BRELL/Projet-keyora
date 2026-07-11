import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rechercher des Biens Immobiliers au Cameroun | Keyora',
  description: 'Parcourez nos annonces de maisons, appartements, duplex, studios et terrains au Cameroun. Filtrez par prix, ville, type de transaction et caractéristiques.',
};

export default function ListingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
