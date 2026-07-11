import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id;
  const title = `Détail de l'annonce | Keyora`;
  return {
    title,
    description: `Consultez les photos, le prix, la localisation et toutes les caractéristiques détaillées de cette annonce immobilière sur Keyora.`,
  };
}

export default function ListingDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
