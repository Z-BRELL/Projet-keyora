import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Publier une Annonce Immobilière | Keyora',
  description: 'Vendez ou louez votre propriété rapidement. Publiez gratuitement votre annonce immobilière avec photos, caractéristiques, prix et localisation au Cameroun.',
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
