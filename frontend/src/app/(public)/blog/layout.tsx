import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog & Conseils Immobiliers | Keyora',
  description: 'Découvrez toute l\'actualité de l\'immobilier au Cameroun, nos guides d\'achat, conseils de vente et astuces pour réussir votre projet immobilier.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
